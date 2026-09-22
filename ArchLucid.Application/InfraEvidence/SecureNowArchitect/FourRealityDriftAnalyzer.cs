using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class FourRealityDriftCandidate
{
    public Guid SourcePathId
    {
        get;
        init;
    }

    public PathKind SourcePathKind
    {
        get;
        init;
    }

    public Guid CloudResourceId
    {
        get;
        init;
    }

    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string? ResourceType
    {
        get;
        init;
    }

    public Guid? RelatedChangeId
    {
        get;
        init;
    }

    public Guid? InventoryDiffId
    {
        get;
        init;
    }

    public FourRealityAccessPosture ObservedPosture
    {
        get;
        init;
    }

    public FourRealityAccessPosture TerraformPosture
    {
        get;
        init;
    }

    public FourRealityAccessPosture DiagramPosture
    {
        get;
        init;
    }

    public FourRealityAccessPosture HistoricalPosture
    {
        get;
        init;
    }

    public IReadOnlyList<SecurityEvidencePathHopRecord> SourceHops
    {
        get;
        init;
    } = [];
}

public sealed class FourRealityDriftAnalysisInputs
{
    public AzureInventorySnapshotDetailReadModel CurrentSnapshot
    {
        get;
        init;
    } = null!;

    public AzureInventorySnapshotDetailReadModel? PriorSnapshot
    {
        get;
        init;
    }

    public Guid? InventoryDiffId
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryChangeRecord> DiffChanges
    {
        get;
        init;
    } = [];

    public DiagramInfrastructureReconciliationResult? DiagramReconciliation
    {
        get;
        init;
    }

    public IReadOnlyList<SecurityEvidencePathRecord> SourcePaths
    {
        get;
        init;
    } = [];

    public IReadOnlyDictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> HopsByPathId
    {
        get;
        init;
    } = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>();
}

public static class FourRealityDriftAnalyzer
{
    private static readonly HashSet<PathKind> DriftSourcePathKinds =
    [
        PathKind.Privilege,
        PathKind.IntendedReachability,
    ];

    public static IReadOnlyList<FourRealityDriftCandidate> Analyze(FourRealityDriftAnalysisInputs inputs)
    {
        ArgumentNullException.ThrowIfNull(inputs);

        List<FourRealityDriftCandidate> candidates = [];
        HashSet<string> dedupeKeys = new(StringComparer.Ordinal);

        foreach (SecurityEvidencePathRecord sourcePath in inputs.SourcePaths)
        {

            if (!DriftSourcePathKinds.Contains(sourcePath.PathKind))
            {
                continue;
            }

            if (!inputs.HopsByPathId.TryGetValue(sourcePath.PathId, out IReadOnlyList<SecurityEvidencePathHopRecord>? hops)
                || hops.Count == 0)
            {
                continue;
            }

            foreach (Guid cloudResourceId in CollectCloudResourceIds(inputs.CurrentSnapshot, hops))
            {
                AzureInventoryResourceRecord? resource = inputs.CurrentSnapshot.Resources
                    .FirstOrDefault(item => item.CloudResourceId == cloudResourceId);

                if (resource is null)
                {
                    continue;
                }

                IReadOnlyDictionary<string, string> currentProperties =
                    FourRealityResourceAccessReader.BuildPropertyBag(inputs.CurrentSnapshot, cloudResourceId);

                IReadOnlyDictionary<string, string>? priorProperties = inputs.PriorSnapshot is null
                    ? null
                    : FourRealityResourceAccessReader.BuildPropertyBag(inputs.PriorSnapshot, cloudResourceId);

                FourRealityAccessPosture observed =
                    FourRealityResourceAccessReader.ReadObservedPosture(currentProperties);
                FourRealityAccessPosture terraform =
                    FourRealityResourceAccessReader.ReadTerraformIntendedPosture(currentProperties);
                FourRealityAccessPosture diagram =
                    FourRealityResourceAccessReader.ReadDiagramPosture(inputs.DiagramReconciliation, cloudResourceId);
                FourRealityAccessPosture historical =
                    FourRealityResourceAccessReader.ReadHistoricalPosture(
                        priorProperties,
                        inputs.DiffChanges,
                        cloudResourceId);

                if (!FourRealityResourceAccessReader.IsDrift(observed, terraform, diagram, historical))
                {
                    continue;
                }

                AzureInventoryChangeRecord? relatedChange = inputs.DiffChanges
                    .Where(change => change.CloudResourceId == cloudResourceId)
                    .FirstOrDefault(change =>
                        change.ChangeType is AzureInventoryChangeType.NetworkExposureChanged
                            or AzureInventoryChangeType.PermissionChanged);

                string dedupeKey =
                    $"{sourcePath.PathId:D}:{cloudResourceId:D}:{relatedChange?.ChangeId.ToString("D") ?? "none"}";

                if (!dedupeKeys.Add(dedupeKey))
                {
                    continue;
                }

                candidates.Add(new FourRealityDriftCandidate
                {
                    SourcePathId = sourcePath.PathId,
                    SourcePathKind = sourcePath.PathKind,
                    CloudResourceId = cloudResourceId,
                    AzureResourceId = resource.AzureResourceId,
                    ResourceType = resource.ResourceType,
                    RelatedChangeId = relatedChange?.ChangeId,
                    InventoryDiffId = inputs.InventoryDiffId,
                    ObservedPosture = observed,
                    TerraformPosture = terraform,
                    DiagramPosture = diagram,
                    HistoricalPosture = historical,
                    SourceHops = hops,
                });
            }
        }

        return candidates;
    }

    private static IEnumerable<Guid> CollectCloudResourceIds(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        HashSet<Guid> cloudResourceIds = [];

        foreach (SecurityEvidencePathHopRecord hop in hops)
        {

            if (hop.CloudResourceId is Guid hopCloudResourceId && hopCloudResourceId != Guid.Empty)
            {
                cloudResourceIds.Add(hopCloudResourceId);
            }

            Guid? fromResourceId = ResolveCloudResourceId(snapshot, hop.FromNodeId);

            if (fromResourceId is Guid fromId)
            {
                cloudResourceIds.Add(fromId);
            }

            Guid? toResourceId = ResolveCloudResourceId(snapshot, hop.ToNodeId);

            if (toResourceId is Guid toId)
            {
                cloudResourceIds.Add(toId);
            }
        }

        return cloudResourceIds;
    }

    private static Guid? ResolveCloudResourceId(AzureInventorySnapshotDetailReadModel snapshot, string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return null;
        }

        AzureInventoryResourceRecord? directMatch = snapshot.Resources
            .FirstOrDefault(resource =>
                string.Equals(resource.AzureResourceId, nodeId, StringComparison.OrdinalIgnoreCase)
                || nodeId.EndsWith(resource.AzureResourceId, StringComparison.OrdinalIgnoreCase));

        if (directMatch?.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
        {
            return cloudResourceId;
        }

        if (nodeId.StartsWith("resource:", StringComparison.OrdinalIgnoreCase))
        {
            string suffix = nodeId["resource:".Length..];

            directMatch = snapshot.Resources.FirstOrDefault(resource =>
                resource.AzureResourceId.EndsWith(suffix, StringComparison.OrdinalIgnoreCase)
                || resource.AzureResourceId.Contains(suffix, StringComparison.OrdinalIgnoreCase));

            if (directMatch?.CloudResourceId is Guid resourceId && resourceId != Guid.Empty)
            {
                return resourceId;
            }
        }

        return null;
    }
}
