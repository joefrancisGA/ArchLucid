using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Diagrams;

/// <summary>
///     Generates a Mermaid flowchart from a <see cref = "GoldenManifest"/> with configurable layout,
///     relationship labels, and optional subgraph grouping via <see cref = "ManifestDiagramOptions"/>.
///     Produces collision-safe, sanitized node IDs for all services and datastores.
/// </summary>
public sealed class ManifestDiagramService : IManifestDiagramService
{
    /// <inheritdoc/>
    public string GenerateMermaid(GoldenManifest manifest, ManifestDiagramOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        options ??= new ManifestDiagramOptions();
        string layout = NormalizeLayout(options.Layout);
        string relationshipLabels = NormalizeRelationshipLabels(options.RelationshipLabels);
        string groupBy = NormalizeGroupBy(options.GroupBy);
        StringBuilder sb = new();
        sb.AppendLine($"flowchart {layout}");
        // Build stable, collision-safe node IDs for services and datastores.
        Dictionary<string, string> nodeIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> usedNodeIds = new(StringComparer.OrdinalIgnoreCase);
        List<ManifestService> services = manifest.Services;
        List<ManifestDatastore> datastores = manifest.Datastores;
        List<ManifestRelationship> manifestRelationships = manifest.Relationships;
        // Optional grouping (subgraphs) for services only.
        if (services.Count > 0)
            if (groupBy == ManifestDiagramConstants.GroupByNone)
                foreach (ManifestService service in services.OrderBy(s => s.ServiceName, StringComparer.OrdinalIgnoreCase))
                {
                    string nodeId = GetOrCreateNodeId("svc", service.ServiceId, service.ServiceName);
                    string label = BuildServiceLabel(service, options.IncludeRuntimePlatform);
                    sb.AppendLine($"    {nodeId}[\"{EscapeLabel(label)}\"]");
                }
            else
            {
                IOrderedEnumerable<IGrouping<string, ManifestService>> groups = services
                    .GroupBy(s => groupBy == ManifestDiagramConstants.GroupByRuntimePlatform ? s.RuntimePlatform.ToString() : s.ServiceType.ToString(),
                        StringComparer.OrdinalIgnoreCase).OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase);
                foreach (IGrouping<string, ManifestService> g in groups)
                {
                    sb.AppendLine($"    subgraph {SanitizeId(g.Key)}[\"{EscapeLabel(g.Key)}\"]");
                    foreach (ManifestService service in g.OrderBy(s => s.ServiceName, StringComparer.OrdinalIgnoreCase))
                    {
                        string nodeId = GetOrCreateNodeId("svc", service.ServiceId, service.ServiceName);
                        string label = BuildServiceLabel(service, options.IncludeRuntimePlatform);
                        sb.AppendLine($"        {nodeId}[\"{EscapeLabel(label)}\"]");
                    }

                    sb.AppendLine("    end");
                }
            }

        foreach (ManifestDatastore datastore in datastores.OrderBy(d => d.DatastoreName, StringComparer.OrdinalIgnoreCase))
        {
            string nodeId = GetOrCreateNodeId("ds", datastore.DatastoreId, datastore.DatastoreName);
            string label = BuildDatastoreLabel(datastore, options.IncludeRuntimePlatform);
            sb.AppendLine($"    {nodeId}[(\"{EscapeLabel(label)}\")]");
        }

        if (services.Count > 0 || datastores.Count > 0)
            sb.AppendLine();

        if (options.IncludeSemanticOverlay)
            AppendSemanticOverlay(sb, manifest, options, usedNodeIds, nodeIds);

        foreach (ManifestRelationship relationship in manifestRelationships)
        {
            string source = ResolveExistingNodeId(relationship.SourceId, manifest, nodeIds) ?? SanitizeId(relationship.SourceId);
            string target = ResolveExistingNodeId(relationship.TargetId, manifest, nodeIds) ?? SanitizeId(relationship.TargetId);
            // Skip edges with missing endpoints.
            if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(target))
                continue;
            if (relationshipLabels == ManifestDiagramConstants.RelationshipLabelsNone)
            {
                sb.AppendLine($"    {source} --> {target}");
                continue;
            }

            string edgeLabel = EscapeLabel(relationship.RelationshipType.ToString());
            sb.AppendLine($"    {source} -->|{edgeLabel}| {target}");
        }

        return sb.ToString().TrimEnd();

        string GetOrCreateNodeId(string kind, string rawId, string fallbackName)
        {
            string key = $"{kind}:{rawId}";
            if (!string.IsNullOrWhiteSpace(rawId) && nodeIds.TryGetValue(key, out string? existing))
                return existing;
            string baseId = SanitizeId(string.IsNullOrWhiteSpace(rawId) ? fallbackName : rawId);
            string unique = EnsureUnique(baseId, usedNodeIds);
            if (!string.IsNullOrWhiteSpace(rawId))
                nodeIds[key] = unique;
            return unique;
        }
    }

    private static string? ResolveExistingNodeId(string sourceOrTargetId, GoldenManifest manifest, Dictionary<string, string> nodeIds)
    {
        if (string.IsNullOrWhiteSpace(sourceOrTargetId))
            return null;
        ManifestService? svc = manifest.Services.FirstOrDefault(s => s.ServiceId.Equals(sourceOrTargetId, StringComparison.OrdinalIgnoreCase));
        if (svc is not null)
        {
            string key = $"svc:{svc.ServiceId}";
            if (!string.IsNullOrWhiteSpace(svc.ServiceId) && nodeIds.TryGetValue(key, out string? id))
                return id;
            return SanitizeId(string.IsNullOrWhiteSpace(svc.ServiceId) ? svc.ServiceName : svc.ServiceId);
        }

        ManifestDatastore? ds = manifest.Datastores.FirstOrDefault(d => d.DatastoreId.Equals(sourceOrTargetId, StringComparison.OrdinalIgnoreCase));
        if (ds is null)
            return null;
        string datastoreKey = $"ds:{ds.DatastoreId}";
        if (!string.IsNullOrWhiteSpace(ds.DatastoreId) && nodeIds.TryGetValue(datastoreKey, out string? datastoreNodeId))
            return datastoreNodeId;
        return SanitizeId(string.IsNullOrWhiteSpace(ds.DatastoreId) ? ds.DatastoreName : ds.DatastoreId);
    }

    private static string BuildServiceLabel(ManifestService service, bool includeRuntimePlatform)
    {
        if (!includeRuntimePlatform)
            return service.ServiceName;
        return string.IsNullOrWhiteSpace(service.RuntimePlatform.ToString()) ? service.ServiceName : $"{service.ServiceName}\\n{service.RuntimePlatform}";
    }

    private static string BuildDatastoreLabel(ManifestDatastore datastore, bool includeRuntimePlatform)
    {
        if (!includeRuntimePlatform)
            return datastore.DatastoreName;
        return string.IsNullOrWhiteSpace(datastore.RuntimePlatform.ToString())
            ? datastore.DatastoreName
            : $"{datastore.DatastoreName}\\n{datastore.RuntimePlatform}";
    }

    private static string EnsureUnique(string baseId, HashSet<string> used)
    {
        if (used.Add(baseId))
            return baseId;
        for (int i = 2; i < 10_000; i++)
        {
            string candidate = $"{baseId}_{i}";
            if (used.Add(candidate))
                return candidate;
        }

        // Extremely unlikely; fall back to a GUID suffix.
        string guidCandidate = $"{baseId}_{Guid.NewGuid():N}";
        used.Add(guidCandidate);
        return guidCandidate;
    }

    private static string SanitizeId(string value)
    {
        return DiagramIdSanitizer.Sanitize(value);
    }

    private static string EscapeLabel(string value)
    {
        return value.Replace("\"", "\\\"");
    }

    private static string NormalizeLayout(string? value)
    {
        string v = (value ?? ManifestDiagramConstants.LayoutLr).Trim().ToUpperInvariant();
        return v switch
        {
            "TB" => ManifestDiagramConstants.LayoutTb,
            _ => ManifestDiagramConstants.LayoutLr
        };
    }

    private static string NormalizeRelationshipLabels(string? value)
    {
        string v = (value ?? ManifestDiagramConstants.RelationshipLabelsType).Trim().ToLowerInvariant();
        return v switch
        {
            "none" => ManifestDiagramConstants.RelationshipLabelsNone,
            _ => ManifestDiagramConstants.RelationshipLabelsType
        };
    }

    private static void AppendSemanticOverlay(
        StringBuilder sb,
        GoldenManifest manifest,
        ManifestDiagramOptions options,
        HashSet<string> usedNodeIds,
        Dictionary<string, string> nodeIds)
    {
        ManifestDiagramSemanticOverlay semantics = manifest.DiagramSemantics;
        List<string> actorLabels = BuildActorLabels(semantics);
        List<string> trustLabels = [.. semantics.TrustBoundaryLabels];
        List<string> requirementLabels = BuildRequirementLabels(manifest, semantics);
        List<string> decisionLabels = BuildDecisionLabels(manifest, semantics);

        int maxNodes = Math.Max(0, options.SemanticOverlayMaxNodes);
        int emitted = 0;
        List<string> requirementNodeIds = [];

        if (actorLabels.Count == 0 && trustLabels.Count == 0 && requirementLabels.Count == 0 && decisionLabels.Count == 0)
            return;

        emitted = AppendSemanticSubgraph(sb, "actors", "Actors", actorLabels, "actor", usedNodeIds, emitted, maxNodes, RenderActorNode, null);
        emitted = AppendSemanticSubgraph(sb, "trust_boundaries", "Trust boundaries", trustLabels, "trust", usedNodeIds, emitted, maxNodes, RenderTrustNode, null);
        emitted = AppendSemanticSubgraph(sb, "requirements", "Requirements", requirementLabels, "req", usedNodeIds, emitted, maxNodes, RenderRequirementNode, requirementNodeIds);
        emitted = AppendSemanticSubgraph(sb, "decisions", "Decisions", decisionLabels, "dec", usedNodeIds, emitted, maxNodes, RenderDecisionNode, null);

        string? topologyAnchor = ResolveTopologyAnchorNodeId(manifest, nodeIds);

        if (topologyAnchor is null)
        {
            sb.AppendLine();
            return;
        }

        foreach (string requirementNodeId in requirementNodeIds)
        {
            sb.AppendLine($"    {requirementNodeId} -.-> {topologyAnchor}");
        }

        sb.AppendLine();
    }

    private static List<string> BuildActorLabels(ManifestDiagramSemanticOverlay semantics)
    {
        List<string> labels = [];

        foreach (ActorDescriptor actor in semantics.Actors)
        {
            string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.Kind.ToString() : actor.Label!.Trim();
            labels.Add($"{label} · {actor.Kind} · {actor.TrustOrigin}");
        }

        return labels;
    }

    private static List<string> BuildRequirementLabels(GoldenManifest manifest, ManifestDiagramSemanticOverlay semantics)
    {
        if (semantics.RequirementLabels.Count > 0)
            return [.. semantics.RequirementLabels];

        List<string> fallback = [];

        foreach (string requirement in manifest.Governance.PolicyConstraints)
        {
            if (!string.IsNullOrWhiteSpace(requirement))
                fallback.Add(requirement.Trim());
        }

        foreach (string control in manifest.Governance.RequiredControls)
        {
            if (!string.IsNullOrWhiteSpace(control))
                fallback.Add($"Control: {control.Trim()}");
        }

        return fallback;
    }

    private static List<string> BuildDecisionLabels(GoldenManifest manifest, ManifestDiagramSemanticOverlay semantics)
    {
        if (semantics.DecisionLabels.Count > 0)
            return [.. semantics.DecisionLabels];

        return manifest.Metadata.DecisionTraceIds
            .Where(traceId => !string.IsNullOrWhiteSpace(traceId))
            .Select(traceId => $"Decision trace: {traceId.Trim()}")
            .ToList();
    }

    private static int AppendSemanticSubgraph(
        StringBuilder sb,
        string subgraphId,
        string subgraphTitle,
        IReadOnlyList<string> labels,
        string nodePrefix,
        HashSet<string> usedNodeIds,
        int emitted,
        int maxNodes,
        Func<string, string> renderNode,
        List<string>? emittedNodeIds)
    {
        if (labels.Count == 0 || emitted >= maxNodes)
            return emitted;

        sb.AppendLine($"    subgraph {subgraphId}[\"{EscapeLabel(subgraphTitle)}\"]");

        for (int index = 0; index < labels.Count; index++)
        {
            if (emitted >= maxNodes)
                break;

            emitted++;
            string nodeId = EnsureUnique(SanitizeId($"{nodePrefix}_{emitted}"), usedNodeIds);
            sb.AppendLine($"        {nodeId}{renderNode(EscapeLabel(labels[index]))}");
            emittedNodeIds?.Add(nodeId);
        }

        sb.AppendLine("    end");
        return emitted;
    }

    private static string RenderActorNode(string label) => $"(\"Actor: {label}\")";

    private static string RenderTrustNode(string label) => $"[/\"Trust: {label}\"/]";

    private static string RenderRequirementNode(string label) => $"[[\"Requirement: {label}\"]]";

    private static string RenderDecisionNode(string label) => $"{{{{\"Decision: {label}\"}}}}";

    private static string? ResolveTopologyAnchorNodeId(GoldenManifest manifest, Dictionary<string, string> nodeIds)
    {
        ManifestService? firstService = manifest.Services
            .OrderBy(service => service.ServiceName, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();

        if (firstService is not null)
        {
            string key = $"svc:{firstService.ServiceId}";

            if (!string.IsNullOrWhiteSpace(firstService.ServiceId) && nodeIds.TryGetValue(key, out string? serviceNodeId))
                return serviceNodeId;
        }

        ManifestDatastore? firstDatastore = manifest.Datastores
            .OrderBy(datastore => datastore.DatastoreName, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();

        if (firstDatastore is null)
            return null;

        string datastoreKey = $"ds:{firstDatastore.DatastoreId}";

        return !string.IsNullOrWhiteSpace(firstDatastore.DatastoreId) && nodeIds.TryGetValue(datastoreKey, out string? datastoreNodeId)
            ? datastoreNodeId
            : null;
    }

    private static string NormalizeGroupBy(string? value)
    {
        string v = (value ?? ManifestDiagramConstants.GroupByNone).Trim().ToLowerInvariant();
        return v switch
        {
            "runtimeplatform" => ManifestDiagramConstants.GroupByRuntimePlatform,
            "servicetype" => ManifestDiagramConstants.GroupByServiceType,
            _ => ManifestDiagramConstants.GroupByNone
        };
    }
}
