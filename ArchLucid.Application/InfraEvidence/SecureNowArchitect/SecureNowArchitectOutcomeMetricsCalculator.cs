using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectOutcomeMetricsSnapshotData
{
    public IReadOnlyList<SecurityEvidencePathRecord> Paths
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

public sealed class SecureNowArchitectOutcomeMetricsInputs
{
    public AzureInventorySnapshotRecord FromSnapshot
    {
        get;
        init;
    } = null!;

    public AzureInventorySnapshotRecord ToSnapshot
    {
        get;
        init;
    } = null!;

    public SecureNowArchitectOutcomeMetricsSnapshotData FromPaths
    {
        get;
        init;
    } = new();

    public SecureNowArchitectOutcomeMetricsSnapshotData ToPaths
    {
        get;
        init;
    } = new();

    public IReadOnlyList<OperationalSecurityExceptionRecord> Exceptions
    {
        get;
        init;
    } = [];

    public IReadOnlyList<OperationalSecurityFindingRecord> Findings
    {
        get;
        init;
    } = [];

    public int OpenFindingsCount
    {
        get;
        init;
    }
}

public sealed class SecureNowArchitectOutcomeMetricsResult
{
    public int CriticalOrHighConfidencePathsRemoved
    {
        get;
        init;
    }

    public int PrivilegedIdentityNodesOnPathsReduced
    {
        get;
        init;
    }

    public int UnrestrictedEgressCapabilityPathsReduced
    {
        get;
        init;
    }

    public int AssertedCrownJewelExposurePathsRemoved
    {
        get;
        init;
    }

    public int SharedControlBlastRadiusPathsRemoved
    {
        get;
        init;
    }

    public int ExceptionsExpired
    {
        get;
        init;
    }

    public int RemediationRecurrenceCount
    {
        get;
        init;
    }
}

/// <summary>Deterministic snapshot N vs N+1 architecture-outcome metrics (SA-11).</summary>
public static class SecureNowArchitectOutcomeMetricsCalculator
{
    public static SecureNowArchitectOutcomeMetricsResult Calculate(SecureNowArchitectOutcomeMetricsInputs inputs)
    {
        ArgumentNullException.ThrowIfNull(inputs);

        if (inputs.FromSnapshot.SnapshotId == inputs.ToSnapshot.SnapshotId)
        {
            return ZeroMetrics();
        }

        HashSet<string> toHashes = BuildHashSet(inputs.ToPaths.Paths);

        int criticalOrHighRemoved = CountRemovedPaths(
            inputs.FromPaths.Paths,
            toHashes,
            path => SecureNowArchitectMetricsConstants.IsCriticalOrHighConfidence(path.PathConfidenceBand));

        int crownJewelRemoved = CountRemovedPaths(
            inputs.FromPaths.Paths,
            toHashes,
            path => path.CrownJewelAssertionId is not null && path.CrownJewelAssertionId != Guid.Empty);

        int sharedControlRemoved = CountRemovedPaths(
            inputs.FromPaths.Paths,
            toHashes,
            path => path.PathKind == PathKind.SharedControlBlastRadius);

        int unrestrictedEgressCapabilityRemoved = CountRemovedPaths(
            inputs.FromPaths.Paths,
            toHashes,
            path => IsUnrestrictedEgressCapabilityPath(path, inputs.FromPaths.HopsByPathId));

        int fromIdentityNodes = CountPrivilegedIdentityNodes(inputs.FromPaths);
        int toIdentityNodes = CountPrivilegedIdentityNodes(inputs.ToPaths);
        int identityNodesReduced = Math.Max(0, fromIdentityNodes - toIdentityNodes);

        DateTime windowStart = SnapshotAnchorUtc(inputs.FromSnapshot);
        DateTime windowEnd = SnapshotAnchorUtc(inputs.ToSnapshot);

        int exceptionsExpired = inputs.Exceptions.Count(item =>
            item.Status == OperationalSecurityExceptionStatus.Expired
            && item.ExpirationUtc > windowStart
            && item.ExpirationUtc <= windowEnd);

        int recurrenceCount = CountRemediationRecurrences(inputs.Findings, windowStart, windowEnd);

        return new SecureNowArchitectOutcomeMetricsResult
        {
            CriticalOrHighConfidencePathsRemoved = criticalOrHighRemoved,
            PrivilegedIdentityNodesOnPathsReduced = identityNodesReduced,
            UnrestrictedEgressCapabilityPathsReduced = unrestrictedEgressCapabilityRemoved,
            AssertedCrownJewelExposurePathsRemoved = crownJewelRemoved,
            SharedControlBlastRadiusPathsRemoved = sharedControlRemoved,
            ExceptionsExpired = exceptionsExpired,
            RemediationRecurrenceCount = recurrenceCount,
        };
    }

    private static SecureNowArchitectOutcomeMetricsResult ZeroMetrics() =>
        new()
        {
            CriticalOrHighConfidencePathsRemoved = 0,
            PrivilegedIdentityNodesOnPathsReduced = 0,
            UnrestrictedEgressCapabilityPathsReduced = 0,
            AssertedCrownJewelExposurePathsRemoved = 0,
            SharedControlBlastRadiusPathsRemoved = 0,
            ExceptionsExpired = 0,
            RemediationRecurrenceCount = 0,
        };

    private static int CountRemovedPaths(
        IReadOnlyList<SecurityEvidencePathRecord> fromPaths,
        HashSet<string> toHashes,
        Func<SecurityEvidencePathRecord, bool> predicate) =>
        fromPaths.Count(path => predicate(path) && !toHashes.Contains(ToHashKey(path.CanonicalHopHashSha256)));

    private static bool IsUnrestrictedEgressCapabilityPath(
        SecurityEvidencePathRecord path,
        IReadOnlyDictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId)
    {

        if (path.PathKind != PathKind.CapabilityToFlow)
        {
            return false;
        }

        if (!hopsByPathId.TryGetValue(path.PathId, out IReadOnlyList<SecurityEvidencePathHopRecord>? hops))
        {
            return false;
        }

        return hops.Any(hop =>
            hop.EdgeType.Equals(SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType, StringComparison.OrdinalIgnoreCase)
            || hop.ToNodeId.Equals(SecureNowArchitectConstants.InternetEgressNodeId, StringComparison.Ordinal));
    }

    private static int CountPrivilegedIdentityNodes(SecureNowArchitectOutcomeMetricsSnapshotData snapshotData)
    {
        HashSet<string> identityNodes = new(StringComparer.Ordinal);

        foreach (SecurityEvidencePathRecord path in snapshotData.Paths)
        {

            if (!snapshotData.HopsByPathId.TryGetValue(path.PathId, out IReadOnlyList<SecurityEvidencePathHopRecord>? hops))
            {
                continue;
            }

            foreach (SecurityEvidencePathHopRecord hop in hops)
            {

                if (!hop.EdgeType.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (IsIdentityNodeId(hop.FromNodeId))
                {
                    identityNodes.Add(hop.FromNodeId);
                }

                if (IsIdentityNodeId(hop.ToNodeId))
                {
                    identityNodes.Add(hop.ToNodeId);
                }
            }
        }

        return identityNodes.Count;
    }

    private static bool IsIdentityNodeId(string nodeId) =>
        !string.IsNullOrWhiteSpace(nodeId)
        && (nodeId.StartsWith("identity:", StringComparison.OrdinalIgnoreCase)
            || nodeId.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase));

    private static int CountRemediationRecurrences(
        IReadOnlyList<OperationalSecurityFindingRecord> findings,
        DateTime windowStart,
        DateTime windowEnd)
    {
        List<OperationalSecurityFindingRecord> scoped = findings
            .Where(finding =>
                finding.CloudResourceId is not null
                && finding.CloudResourceId != Guid.Empty
                && !string.IsNullOrWhiteSpace(finding.ControlId))
            .ToList();

        HashSet<(Guid CloudResourceId, string ControlId)> closedPairs = scoped
            .Where(finding => finding.Status == OperationalSecurityFindingStatus.Closed)
            .Select(finding => (finding.CloudResourceId!.Value, finding.ControlId!))
            .ToHashSet();

        HashSet<(Guid CloudResourceId, string ControlId)> recurrencePairs = [];

        foreach (OperationalSecurityFindingRecord finding in scoped)
        {

            if (finding.UpdatedUtc <= windowStart || finding.UpdatedUtc > windowEnd)
            {
                continue;
            }

            (Guid CloudResourceId, string ControlId) pair =
                (finding.CloudResourceId!.Value, finding.ControlId!);

            if (finding.Status == OperationalSecurityFindingStatus.Recurred)
            {
                recurrencePairs.Add(pair);
                continue;
            }

            if (finding.Status == OperationalSecurityFindingStatus.Open
                && closedPairs.Contains(pair))
            {
                recurrencePairs.Add(pair);
            }
        }

        return recurrencePairs.Count;
    }

    private static HashSet<string> BuildHashSet(IReadOnlyList<SecurityEvidencePathRecord> paths) =>
        paths.Select(path => ToHashKey(path.CanonicalHopHashSha256)).ToHashSet(StringComparer.Ordinal);

    private static string ToHashKey(byte[] hash) => Convert.ToHexStringLower(hash);

    private static DateTime SnapshotAnchorUtc(AzureInventorySnapshotRecord snapshot) =>
        snapshot.UpdatedUtc != default ? snapshot.UpdatedUtc : snapshot.CreatedUtc;
}
