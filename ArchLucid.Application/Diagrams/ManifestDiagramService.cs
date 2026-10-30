using System.Text;

using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
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
                    .GroupBy(s => groupBy == ManifestDiagramConstants.GroupByRuntimePlatform
                            ? FormatRuntimePlatformGroupKey(s.RuntimePlatform)
                            : FormatServiceTypeGroupKey(s.ServiceType),
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
            AppendSemanticOverlay(sb, manifest, options, usedNodeIds);

        foreach (ManifestRelationship relationship in manifestRelationships)
        {
            string source = ResolveRelationshipEndpointNodeId(
                relationship.SourceId,
                manifest,
                nodeIds,
                usedNodeIds,
                sb);
            string target = ResolveRelationshipEndpointNodeId(
                relationship.TargetId,
                manifest,
                nodeIds,
                usedNodeIds,
                sb);
            if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(target))
                continue;
            if (relationshipLabels == ManifestDiagramConstants.RelationshipLabelsNone)
            {
                sb.AppendLine($"    {source} --> {target}");
                continue;
            }

            string edgeLabel = EscapeLabel(FormatRelationshipTypeLabel(relationship.RelationshipType));
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
        string serviceName = string.IsNullOrWhiteSpace(service.ServiceName)
            ? ManifestDiagramHonestyCopy.ServiceNameNotStored
            : service.ServiceName.Trim();
        if (!includeRuntimePlatform)
            return serviceName;
        string platformLabel = ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(service.RuntimePlatform);
        return $"{serviceName}\\n{platformLabel}";
    }

    private static string BuildDatastoreLabel(ManifestDatastore datastore, bool includeRuntimePlatform)
    {
        string datastoreName = string.IsNullOrWhiteSpace(datastore.DatastoreName)
            ? ManifestDiagramHonestyCopy.DatastoreNameNotStored
            : datastore.DatastoreName.Trim();
        if (!includeRuntimePlatform)
            return datastoreName;
        string platformLabel = ArchitectureManifestTopologyExport.FormatRuntimePlatformForExport(datastore.RuntimePlatform);
        return $"{datastoreName}\\n{platformLabel}";
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
        HashSet<string> usedNodeIds)
    {
        ManifestDiagramSemanticOverlay semantics = manifest.DiagramSemantics;
        List<string> actorLabels = BuildActorLabels(semantics);
        List<string> trustLabels = BuildTrustBoundaryLabels(semantics);
        List<string> requirementLabels = BuildRequirementLabels(manifest, semantics);
        List<string> decisionLabels = BuildDecisionLabels(manifest, semantics);
        int totalOverlayLabels =
            actorLabels.Count + trustLabels.Count + requirementLabels.Count + decisionLabels.Count;

        int maxNodes = Math.Max(0, options.SemanticOverlayMaxNodes);
        int emitted = 0;

        if (totalOverlayLabels == 0)
            return;

        emitted = AppendSemanticSubgraph(sb, "actors", "Actors", actorLabels, "actor", usedNodeIds, emitted, maxNodes, RenderActorNode, null);
        emitted = AppendSemanticSubgraph(sb, "trust_boundaries", "Trust boundaries", trustLabels, "trust", usedNodeIds, emitted, maxNodes, RenderTrustNode, null);
        emitted = AppendSemanticSubgraph(sb, "requirements", "Requirements", requirementLabels, "req", usedNodeIds, emitted, maxNodes, RenderRequirementNode, null);
        emitted = AppendSemanticSubgraph(sb, "decisions", "Decisions", decisionLabels, "dec", usedNodeIds, emitted, maxNodes, RenderDecisionNode, null);

        int omittedOverlayLabels = totalOverlayLabels - emitted;

        if (omittedOverlayLabels > 0 && maxNodes > 0)
        {
            string remainderNodeId = EnsureUnique(SanitizeId("overlay_remainder"), usedNodeIds);
            sb.AppendLine(
                $"    {remainderNodeId}[[\"+ {omittedOverlayLabels} more semantic overlay labels were not drawn on this diagram.\"]]");
        }

        sb.AppendLine();
    }

    private static List<string> BuildActorLabels(ManifestDiagramSemanticOverlay semantics)
    {
        List<string> labels = [];

        foreach (ActorDescriptor actor in semantics.Actors)
        {
            string label = string.IsNullOrWhiteSpace(actor.Label)
                ? ManifestDiagramHonestyCopy.ActorLabelNotStored
                : actor.Label.Trim();
            labels.Add(FormatActorDiagramLabel(actor, label));
        }

        return labels;
    }

    private static string FormatActorDiagramLabel(ActorDescriptor actor, string displayLabel)
    {
        string originClause = actor.Origin == ActorOrigin.Inferred
            ? actor.Confidence is > 0 and < 100
                ? $"Inferred actor axes (confidence {actor.Confidence})."
                : "Inferred actor axes (confidence was not stored)."
            : "Operator-asserted actor axes.";

        return $"{displayLabel} · {actor.Kind} · {actor.TrustOrigin} · {actor.Contract} · {originClause}";
    }

    private static List<string> BuildTrustBoundaryLabels(ManifestDiagramSemanticOverlay semantics)
    {
        List<string> labels = [];

        foreach (string trustLabel in semantics.TrustBoundaryLabels)
        {
            labels.Add(string.IsNullOrWhiteSpace(trustLabel)
                ? ManifestDiagramHonestyCopy.TrustBoundaryLabelNotStored
                : trustLabel.Trim());
        }

        return labels;
    }

    private static List<string> BuildRequirementLabels(GoldenManifest manifest, ManifestDiagramSemanticOverlay semantics)
    {
        if (semantics.RequirementLabels.Count > 0)
        {
            return semantics.RequirementLabels
                .Select(label => string.IsNullOrWhiteSpace(label)
                    ? ManifestDiagramHonestyCopy.RequirementLabelNotStored
                    : label.Trim())
                .ToList();
        }

        List<string> fallback = [];

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
        {
            return semantics.DecisionLabels
                .Select(label => string.IsNullOrWhiteSpace(label)
                    ? ManifestDiagramHonestyCopy.DecisionLabelNotStored
                    : label.Trim())
                .ToList();
        }

        return manifest.Metadata.DecisionTraceIds
            .Select(traceId => string.IsNullOrWhiteSpace(traceId)
                ? ManifestDiagramHonestyCopy.DecisionTraceIdNotStored
                : $"Decision trace: {traceId.Trim()}")
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

    private static string FormatServiceTypeGroupKey(ServiceType serviceType) =>
        serviceType == ServiceType.Unknown
            ? ManifestDiagramHonestyCopy.ServiceTypeNotStored
            : serviceType.ToString();

    private static string FormatRuntimePlatformGroupKey(RuntimePlatform runtimePlatform) =>
        runtimePlatform == RuntimePlatform.Unknown
            ? ManifestDiagramHonestyCopy.RuntimePlatformNotStored
            : runtimePlatform.ToString();

    private static string FormatRelationshipTypeLabel(RelationshipType relationshipType)
    {
        if (!Enum.IsDefined(relationshipType))
            return ManifestDiagramHonestyCopy.RelationshipTypeNotStored;

        return ArchitectureManifestMarkdownSummaryExport.FormatRelationshipTypeForSummary(relationshipType);
    }

    private static string ResolveRelationshipEndpointNodeId(
        string endpointId,
        GoldenManifest manifest,
        Dictionary<string, string> nodeIds,
        HashSet<string> usedNodeIds,
        StringBuilder sb)
    {
        if (string.IsNullOrWhiteSpace(endpointId))
        {
            return EnsureHonestyPlaceholderNode(
                nodeIds,
                usedNodeIds,
                sb,
                "relationship-endpoint-missing",
                ArchitectureManifestMarkdownSummaryExport.RelationshipEndpointNotStored);
        }

        string? existing = ResolveExistingNodeId(endpointId, manifest, nodeIds);
        if (existing is not null)
            return existing;

        return EnsureHonestyPlaceholderNode(
            nodeIds,
            usedNodeIds,
            sb,
            $"relationship-endpoint:{endpointId}",
            ArchitectureManifestMarkdownSummaryExport.ComponentNameNotStored);
    }

    private static string EnsureHonestyPlaceholderNode(
        Dictionary<string, string> nodeIds,
        HashSet<string> usedNodeIds,
        StringBuilder sb,
        string cacheKey,
        string label)
    {
        if (nodeIds.TryGetValue(cacheKey, out string? cached))
            return cached;

        string nodeId = EnsureUnique(SanitizeId(cacheKey), usedNodeIds);
        nodeIds[cacheKey] = nodeId;
        sb.AppendLine($"    {nodeId}[(\"{EscapeLabel(label)}\")]");
        return nodeId;
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
