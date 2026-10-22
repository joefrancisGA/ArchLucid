using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Projects publish-approved κ model components into committed manifest topology (TB-2352 lift).
/// </summary>
public static class ClosedLoopManifestTopologyMerger
{
    private const string ClosedLoopTopologyResourceTag = "ClosedLoopStrengthened";

    public static ClosedLoopManifestTopologyMergeResult MergePublishableTopology(
        ManifestDocument manifest,
        ArchitectureKnowledgeModel? model)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        if (model is null || model.Elements.Count == 0)
        {
            return new ClosedLoopManifestTopologyMergeResult();
        }

        TopologySection topology = manifest.Topology;
        Dictionary<string, string> elementIdToManifestNodeId = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> existingServiceNames = topology.Services
            .Select(static service => service.ServiceName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> existingDatastoreNames = topology.Datastores
            .Select(static datastore => datastore.DatastoreName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int mergedServiceCount = 0;
        int mergedDatastoreCount = 0;

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.LifecycleScope == ArchitectureLifecycleScope.CurrentState)
                continue;

            if (element.Kind is not (ArchitectureElementKind.Component or ArchitectureElementKind.DeploymentTopology))
                continue;

            if (TryMergeDatastore(element, topology, existingDatastoreNames, elementIdToManifestNodeId))
            {
                mergedDatastoreCount++;
                continue;
            }

            if (TryMergeService(element, topology, existingServiceNames, elementIdToManifestNodeId))
                mergedServiceCount++;
        }

        int mergedRelationshipCount = MergeDataFlowRelationships(model, topology, elementIdToManifestNodeId);

        if (mergedServiceCount > 0 || mergedDatastoreCount > 0 || mergedRelationshipCount > 0)
        {
            topology.Resources.Add(ClosedLoopTopologyResourceTag);
        }

        return new ClosedLoopManifestTopologyMergeResult
        {
            MergedServiceCount = mergedServiceCount,
            MergedDatastoreCount = mergedDatastoreCount,
            MergedRelationshipCount = mergedRelationshipCount,
        };
    }

    private static bool TryMergeService(
        ArchitectureModelElement element,
        TopologySection topology,
        HashSet<string> existingServiceNames,
        Dictionary<string, string> elementIdToManifestNodeId)
    {
        if (existingServiceNames.Contains(element.Name))
        {
            ManifestService? existing = topology.Services
                .FirstOrDefault(service =>
                    string.Equals(service.ServiceName, element.Name, StringComparison.OrdinalIgnoreCase));

            if (existing is not null)
                elementIdToManifestNodeId[element.ElementId] = existing.ServiceId;

            return false;
        }

        string hint = BuildElementHint(element);
        ManifestService service = new()
        {
            ServiceId = CreateStableNodeId(element.ElementId),
            ServiceName = element.Name,
            ServiceType = InferServiceType(hint),
            RuntimePlatform = InferRuntimePlatform(hint, asDatastore: false),
            Purpose = string.IsNullOrWhiteSpace(element.Description) ? null : element.Description.Trim(),
            Tags = [ClosedLoopTopologyResourceTag],
        };

        topology.Services.Add(service);
        existingServiceNames.Add(element.Name);
        elementIdToManifestNodeId[element.ElementId] = service.ServiceId;

        return true;
    }

    private static bool TryMergeDatastore(
        ArchitectureModelElement element,
        TopologySection topology,
        HashSet<string> existingDatastoreNames,
        Dictionary<string, string> elementIdToManifestNodeId)
    {
        string hint = BuildElementHint(element);

        if (!LooksLikeDatastore(hint))
            return false;

        if (existingDatastoreNames.Contains(element.Name))
        {
            ManifestDatastore? existing = topology.Datastores
                .FirstOrDefault(datastore =>
                    string.Equals(datastore.DatastoreName, element.Name, StringComparison.OrdinalIgnoreCase));

            if (existing is not null)
                elementIdToManifestNodeId[element.ElementId] = existing.DatastoreId;

            return false;
        }

        ManifestDatastore datastore = new()
        {
            DatastoreId = CreateStableNodeId(element.ElementId),
            DatastoreName = element.Name,
            DatastoreType = InferDatastoreType(hint),
            RuntimePlatform = InferRuntimePlatform(hint, asDatastore: true),
            Purpose = string.IsNullOrWhiteSpace(element.Description) ? null : element.Description.Trim(),
        };

        topology.Datastores.Add(datastore);
        existingDatastoreNames.Add(element.Name);
        elementIdToManifestNodeId[element.ElementId] = datastore.DatastoreId;

        return true;
    }

    private static int MergeDataFlowRelationships(
        ArchitectureKnowledgeModel model,
        TopologySection topology,
        Dictionary<string, string> elementIdToManifestNodeId)
    {
        HashSet<string> existingRelationshipKeys = topology.Relationships
            .Select(static relationship => $"{relationship.SourceId}->{relationship.TargetId}:{relationship.RelationshipType}")
            .ToHashSet(StringComparer.Ordinal);

        int mergedCount = 0;

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.Kind != ArchitectureElementKind.DataFlow)
                continue;

            if (element.RelatedElementIds.Count < 2)
                continue;

            string sourceElementId = element.RelatedElementIds[0];
            string targetElementId = element.RelatedElementIds[1];

            if (!elementIdToManifestNodeId.TryGetValue(sourceElementId, out string? sourceId))
                continue;

            if (!elementIdToManifestNodeId.TryGetValue(targetElementId, out string? targetId))
                continue;

            RelationshipType relationshipType = InferRelationshipType(element);
            string relationshipKey = $"{sourceId}->{targetId}:{relationshipType}";

            if (existingRelationshipKeys.Contains(relationshipKey))
                continue;

            topology.Relationships.Add(new ManifestRelationship
            {
                RelationshipId = Guid.NewGuid().ToString("N"),
                SourceId = sourceId,
                TargetId = targetId,
                RelationshipType = relationshipType,
                Description = element.Description,
            });

            existingRelationshipKeys.Add(relationshipKey);
            mergedCount++;
        }

        return mergedCount;
    }

    private static string BuildElementHint(ArchitectureModelElement element)
    {
        string propertiesHint = string.Join(
            ' ',
            element.Properties.Values.Where(static value => !string.IsNullOrWhiteSpace(value)));

        return $"{element.Kind} {element.Name} {element.Description} {propertiesHint}";
    }

    private static string CreateStableNodeId(string elementId) =>
        $"cl-{elementId.Replace("-", string.Empty, StringComparison.Ordinal)}";

    private static bool LooksLikeDatastore(string hint)
    {
        string upper = hint.ToUpperInvariant();

        if (upper.Contains("DATASTORE", StringComparison.Ordinal))
            return true;

        if (upper.Contains("DATABASE", StringComparison.Ordinal) || upper.Contains(" DB ", StringComparison.Ordinal))
            return true;

        if (upper.Contains("SQL", StringComparison.Ordinal) && !upper.Contains("API", StringComparison.Ordinal))
            return true;

        if (upper.Contains("BLOB", StringComparison.Ordinal)
            || upper.Contains("STORAGE ACCOUNT", StringComparison.Ordinal))
            return true;

        if (upper.Contains("CACHE", StringComparison.Ordinal) || upper.Contains("REDIS", StringComparison.Ordinal))
            return true;

        if (upper.Contains("COSMOS", StringComparison.Ordinal))
            return true;

        return false;
    }

    private static ServiceType InferServiceType(string hint)
    {
        string upper = hint.ToUpperInvariant();

        if (upper.Contains("API", StringComparison.Ordinal))
            return ServiceType.Api;

        if (upper.Contains("UI", StringComparison.Ordinal) || upper.Contains("WEB", StringComparison.Ordinal))
            return ServiceType.Ui;

        if (upper.Contains("WORKER", StringComparison.Ordinal) || upper.Contains("JOB", StringComparison.Ordinal))
            return ServiceType.Worker;

        if (upper.Contains("INTEGRATION", StringComparison.Ordinal) || upper.Contains("ADAPTER", StringComparison.Ordinal))
            return ServiceType.Integration;

        if (upper.Contains("SEARCH", StringComparison.Ordinal))
            return ServiceType.SearchService;

        return ServiceType.Unknown;
    }

    private static DatastoreType InferDatastoreType(string hint)
    {
        string upper = hint.ToUpperInvariant();

        if (upper.Contains("BLOB", StringComparison.Ordinal) || upper.Contains("OBJECT", StringComparison.Ordinal))
            return DatastoreType.Object;

        if (upper.Contains("CACHE", StringComparison.Ordinal) || upper.Contains("REDIS", StringComparison.Ordinal))
            return DatastoreType.Cache;

        if (upper.Contains("SEARCH", StringComparison.Ordinal)
            || upper.Contains("INDEX", StringComparison.Ordinal)
            || upper.Contains("VECTOR", StringComparison.Ordinal))
            return DatastoreType.Search;

        if (upper.Contains("NOSQL", StringComparison.Ordinal)
            || upper.Contains("DOCUMENT", StringComparison.Ordinal)
            || upper.Contains("COSMOS", StringComparison.Ordinal))
            return DatastoreType.NoSql;

        if (upper.Contains("SQL", StringComparison.Ordinal)
            || upper.Contains("RELATIONAL", StringComparison.Ordinal)
            || upper.Contains("DATABASE", StringComparison.Ordinal)
            || upper.Contains("DB", StringComparison.Ordinal))
            return DatastoreType.Sql;

        return DatastoreType.Unknown;
    }

    private static RuntimePlatform InferRuntimePlatform(string hint, bool asDatastore)
    {
        string upper = hint.ToUpperInvariant();

        if (upper.Contains("APP SERVICE", StringComparison.Ordinal)
            || upper.Contains("APPSERVICE", StringComparison.Ordinal)
            || upper.Contains("WEB APP", StringComparison.Ordinal))
            return RuntimePlatform.AppService;

        if (upper.Contains("FUNCTION", StringComparison.Ordinal) || upper.Contains("SERVERLESS", StringComparison.Ordinal))
            return RuntimePlatform.Functions;

        if (upper.Contains("AKS", StringComparison.Ordinal) || upper.Contains("KUBERNETES", StringComparison.Ordinal))
            return RuntimePlatform.Aks;

        if (upper.Contains("VM", StringComparison.Ordinal) || upper.Contains("VIRTUAL MACHINE", StringComparison.Ordinal))
            return RuntimePlatform.Vm;

        if (upper.Contains("CONTAINER APP", StringComparison.Ordinal))
            return RuntimePlatform.ContainerApps;

        if (upper.Contains("SQL", StringComparison.Ordinal) || upper.Contains("MANAGED INSTANCE", StringComparison.Ordinal))
            return RuntimePlatform.SqlServer;

        if (upper.Contains("REDIS", StringComparison.Ordinal))
            return RuntimePlatform.Redis;

        if (upper.Contains("BLOB", StringComparison.Ordinal) || upper.Contains("STORAGE", StringComparison.Ordinal))
            return RuntimePlatform.BlobStorage;

        if (asDatastore && upper.Contains("DATABASE", StringComparison.Ordinal))
            return RuntimePlatform.SqlServer;

        return RuntimePlatform.Unknown;
    }

    private static RelationshipType InferRelationshipType(ArchitectureModelElement element)
    {
        string hint = BuildElementHint(element).ToUpperInvariant();

        if (hint.Contains("WRITE", StringComparison.Ordinal) || hint.Contains("PERSIST", StringComparison.Ordinal))
            return RelationshipType.WritesTo;

        if (hint.Contains("READ", StringComparison.Ordinal) || hint.Contains("QUERY", StringComparison.Ordinal))
            return RelationshipType.ReadsFrom;

        if (hint.Contains("PUBLISH", StringComparison.Ordinal) || hint.Contains("EVENT", StringComparison.Ordinal))
            return RelationshipType.PublishesTo;

        if (hint.Contains("SUBSCRIBE", StringComparison.Ordinal))
            return RelationshipType.SubscribesTo;

        if (hint.Contains("AUTH", StringComparison.Ordinal) || hint.Contains("TOKEN", StringComparison.Ordinal))
            return RelationshipType.AuthenticatesWith;

        return RelationshipType.Calls;
    }
}

public sealed class ClosedLoopManifestTopologyMergeResult
{
    public int MergedServiceCount
    {
        get;
        init;
    }

    public int MergedDatastoreCount
    {
        get;
        init;
    }

    public int MergedRelationshipCount
    {
        get;
        init;
    }
}
