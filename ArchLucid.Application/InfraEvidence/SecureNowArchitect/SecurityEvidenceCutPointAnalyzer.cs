using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecurityEvidenceCutPointCandidate
{
    public SecurityEvidenceCutPointKind CutKind
    {
        get;
        init;
    }

    public string CutKey
    {
        get;
        init;
    } = string.Empty;

    public string? FromNodeId
    {
        get;
        init;
    }

    public string? ToNodeId
    {
        get;
        init;
    }

    public string? EdgeType
    {
        get;
        init;
    }

    public HashSet<Guid> CollapsedPathIds
    {
        get;
        init;
    } = [];

    public HashSet<string> EvidenceReferences
    {
        get;
        init;
    } = [];

    public SecurityEvidenceCutPointOperationalCostClass OperationalCostClass
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? ResourceType
    {
        get;
        init;
    }
}

/// <summary>Deterministic cut-point aggregation over ranked paths (SA-10).</summary>
public static class SecurityEvidenceCutPointAnalyzer
{
    public static IReadOnlyList<SecurityEvidenceCutPointCandidate> Analyze(
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> rankedPaths,
        IReadOnlyDictionary<Guid, string?> resourceTypesByCloudResourceId)
    {
        ArgumentNullException.ThrowIfNull(rankedPaths);
        ArgumentNullException.ThrowIfNull(resourceTypesByCloudResourceId);

        Dictionary<string, SecurityEvidenceCutPointCandidate> candidates = new(StringComparer.Ordinal);

        foreach ((SecurityEvidencePathRecord path, IReadOnlyList<SecurityEvidencePathHopRecord> hops) in rankedPaths)
        {

            foreach (SecurityEvidencePathHopRecord hop in hops)
            {
                RegisterEdgeCut(candidates, path.PathId, hop, resourceTypesByCloudResourceId);

                if (SecurityEvidenceCutPointCostClassifier.IsEligibleCutNode(hop.FromNodeId))
                {
                    RegisterNodeCut(
                        candidates,
                        path.PathId,
                        hop.FromNodeId,
                        hop.CloudResourceId,
                        hop.EvidenceReference,
                        resourceTypesByCloudResourceId);
                }

                if (SecurityEvidenceCutPointCostClassifier.IsEligibleCutNode(hop.ToNodeId))
                {
                    RegisterNodeCut(
                        candidates,
                        path.PathId,
                        hop.ToNodeId,
                        hop.CloudResourceId,
                        hop.EvidenceReference,
                        resourceTypesByCloudResourceId);
                }
            }
        }

        return candidates.Values
            .Where(candidate => candidate.CollapsedPathIds.Count > 0)
            .OrderByDescending(candidate => SecurityEvidenceCutPointConstants.ComputeLeverageScore(
                candidate.CollapsedPathIds.Count,
                candidate.OperationalCostClass))
            .ThenByDescending(candidate => candidate.CollapsedPathIds.Count)
            .ThenBy(candidate => candidate.CutKey, StringComparer.Ordinal)
            .ToList();
    }

    public static SecurityEvidenceCutPointRecord ToRecord(
        SecurityEvidenceCutPointCandidate candidate,
        Guid tenantId,
        Guid snapshotId,
        int cutOrder,
        DateTime computedUtc,
        string? suggestedPatternKey)
    {
        int pathsCollapsed = candidate.CollapsedPathIds.Count;

        return new SecurityEvidenceCutPointRecord
        {
            CutPointId = Guid.NewGuid(),
            TenantId = tenantId,
            SnapshotId = snapshotId,
            RuleVersion = SecurityEvidenceCutPointConstants.RuleVersion,
            CutKind = candidate.CutKind,
            CutKey = candidate.CutKey,
            FromNodeId = candidate.FromNodeId,
            ToNodeId = candidate.ToNodeId,
            EdgeType = candidate.EdgeType,
            PathsCollapsedCount = pathsCollapsed,
            OperationalCostClass = candidate.OperationalCostClass,
            LeverageScore = SecurityEvidenceCutPointConstants.ComputeLeverageScore(
                pathsCollapsed,
                candidate.OperationalCostClass),
            CutOrder = cutOrder,
            EvidenceReferencesJson = JsonSerializer.Serialize(candidate.EvidenceReferences.OrderBy(item => item)),
            CollapsedPathIdsJson = JsonSerializer.Serialize(candidate.CollapsedPathIds.OrderBy(item => item)),
            SuggestedPatternKey = suggestedPatternKey,
            CloudResourceId = candidate.CloudResourceId,
            ResourceType = candidate.ResourceType,
            ComputedUtc = computedUtc,
        };
    }

    private static void RegisterEdgeCut(
        Dictionary<string, SecurityEvidenceCutPointCandidate> candidates,
        Guid pathId,
        SecurityEvidencePathHopRecord hop,
        IReadOnlyDictionary<Guid, string?> resourceTypesByCloudResourceId)
    {
        string cutKey = BuildEdgeCutKey(hop.FromNodeId, hop.EdgeType, hop.ToNodeId);
        SecurityEvidenceCutPointOperationalCostClass costClass = SecurityEvidenceCutPointCostClassifier.ClassifyEdge(hop);
        string? resourceType = ResolveResourceType(hop.CloudResourceId, resourceTypesByCloudResourceId);

        if (!candidates.TryGetValue(cutKey, out SecurityEvidenceCutPointCandidate? candidate))
        {
            candidate = new SecurityEvidenceCutPointCandidate
            {
                CutKind = SecurityEvidenceCutPointKind.Edge,
                CutKey = cutKey,
                FromNodeId = hop.FromNodeId,
                ToNodeId = hop.ToNodeId,
                EdgeType = hop.EdgeType,
                OperationalCostClass = costClass,
                CloudResourceId = hop.CloudResourceId,
                ResourceType = resourceType,
            };

            candidates[cutKey] = candidate;
        }

        candidate.CollapsedPathIds.Add(pathId);

        if (!string.IsNullOrWhiteSpace(hop.EvidenceReference))
        {
            candidate.EvidenceReferences.Add(hop.EvidenceReference);
        }
    }

    private static void RegisterNodeCut(
        Dictionary<string, SecurityEvidenceCutPointCandidate> candidates,
        Guid pathId,
        string nodeId,
        Guid? cloudResourceId,
        string evidenceReference,
        IReadOnlyDictionary<Guid, string?> resourceTypesByCloudResourceId)
    {
        string cutKey = BuildNodeCutKey(nodeId);
        SecurityEvidenceCutPointOperationalCostClass costClass = SecurityEvidenceCutPointCostClassifier.ClassifyNode(nodeId);
        string? resourceType = ResolveResourceType(cloudResourceId, resourceTypesByCloudResourceId);

        if (!candidates.TryGetValue(cutKey, out SecurityEvidenceCutPointCandidate? candidate))
        {
            candidate = new SecurityEvidenceCutPointCandidate
            {
                CutKind = SecurityEvidenceCutPointKind.Node,
                CutKey = cutKey,
                FromNodeId = nodeId,
                OperationalCostClass = costClass,
                CloudResourceId = cloudResourceId,
                ResourceType = resourceType,
            };

            candidates[cutKey] = candidate;
        }

        candidate.CollapsedPathIds.Add(pathId);

        if (!string.IsNullOrWhiteSpace(evidenceReference))
        {
            candidate.EvidenceReferences.Add(evidenceReference);
        }
    }

    private static string BuildEdgeCutKey(string fromNodeId, string edgeType, string toNodeId) =>
        $"edge:{fromNodeId}|{edgeType}|{toNodeId}";

    private static string BuildNodeCutKey(string nodeId) =>
        $"node:{nodeId}";

    private static string? ResolveResourceType(
        Guid? cloudResourceId,
        IReadOnlyDictionary<Guid, string?> resourceTypesByCloudResourceId)
    {
        if (cloudResourceId is null || cloudResourceId == Guid.Empty)
        {
            return null;
        }

        return resourceTypesByCloudResourceId.TryGetValue(cloudResourceId.Value, out string? resourceType)
            ? resourceType
            : null;
    }
}
