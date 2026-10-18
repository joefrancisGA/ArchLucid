using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecurityEvidencePathReportAssembler
{
    private static readonly PathKind[] AttackPathKinds =
    [
        PathKind.Privilege,
        PathKind.IntendedReachability,
        PathKind.ToxicCombination,
    ];

    public static SecurityEvidencePathReportResponse Assemble(
        Guid snapshotId,
        IReadOnlyList<SecurityEvidencePathWithHops> pathsWithHops,
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> searchCoverageRows)
    {
        ArgumentNullException.ThrowIfNull(pathsWithHops);
        ArgumentNullException.ThrowIfNull(ranks);
        ArgumentNullException.ThrowIfNull(searchCoverageRows);

        Dictionary<Guid, SecurityEvidencePathWithHops> attackPaths = pathsWithHops
            .Where(entry => IsAttackPathKind(entry.Path.PathKind))
            .ToDictionary(entry => entry.Path.PathId);

        List<SecurityEvidencePathRankSummaryResponse> vulnerable = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks
                     .Where(rank => rank.SnapshotId == snapshotId && attackPaths.ContainsKey(rank.PathId))
                     .OrderBy(rank => rank.RankOrder))
        {
            SecurityEvidencePathRecord path = attackPaths[rank.PathId].Path;

            if (!IsVulnerableBand(path.PathConfidenceBand))
            {
                continue;
            }

            vulnerable.Add(MapRankSummary(rank, path));
        }

        List<SecurityEvidencePathReportUnevaluatedGroupResponse> unevaluated = [];
        AppendInsufficientEvidenceGroups(unevaluated, attackPaths);
        AppendControlPlaneOnlyGroup(unevaluated, attackPaths);
        AppendSearchStoppedGroups(unevaluated, searchCoverageRows);

        return new SecurityEvidencePathReportResponse
        {
            SnapshotId = snapshotId,
            VulnerableAttackPaths = vulnerable,
            UnevaluatedGroups = unevaluated,
        };
    }

    private static void AppendInsufficientEvidenceGroups(
        List<SecurityEvidencePathReportUnevaluatedGroupResponse> groups,
        Dictionary<Guid, SecurityEvidencePathWithHops> attackPaths)
    {
        List<SecurityEvidencePathWithHops> insufficientPaths = attackPaths.Values
            .Where(entry => entry.Path.PathConfidenceBand == PathConfidenceBand.InsufficientEvidence)
            .ToList();

        if (insufficientPaths.Count == 0)
        {
            return;
        }

        HashSet<Guid> assignedToEdgeGroup = [];

        foreach (string reasonCode in SecurityEvidencePathReportReasonCatalog.InsufficientEvidenceEdgeReasonCodesInOrder())
        {
            List<Guid> pathIds = [];

            foreach (SecurityEvidencePathWithHops entry in insufficientPaths)
            {

                if (entry.Hops.Any(hop => string.Equals(hop.EdgeType, reasonCode, StringComparison.Ordinal)))
                {
                    pathIds.Add(entry.Path.PathId);
                    assignedToEdgeGroup.Add(entry.Path.PathId);
                }
            }

            if (pathIds.Count == 0)
            {
                continue;
            }

            groups.Add(new SecurityEvidencePathReportUnevaluatedGroupResponse
            {
                ReasonCode = reasonCode,
                WhyText = SecurityEvidencePathReportReasonCatalog.GetWhyText(reasonCode),
                PathCount = pathIds.Count,
                PathIds = pathIds,
            });
        }

        List<Guid> unspecifiedPathIds = insufficientPaths
            .Where(entry => !assignedToEdgeGroup.Contains(entry.Path.PathId))
            .Select(entry => entry.Path.PathId)
            .ToList();

        if (unspecifiedPathIds.Count == 0)
        {
            return;
        }

        groups.Add(new SecurityEvidencePathReportUnevaluatedGroupResponse
        {
            ReasonCode = SecurityEvidencePathReportReasonCodes.InsufficientEvidenceUnspecified,
            WhyText = SecurityEvidencePathReportReasonCatalog.GetWhyText(
                SecurityEvidencePathReportReasonCodes.InsufficientEvidenceUnspecified),
            PathCount = unspecifiedPathIds.Count,
            PathIds = unspecifiedPathIds,
        });
    }

    private static void AppendControlPlaneOnlyGroup(
        List<SecurityEvidencePathReportUnevaluatedGroupResponse> groups,
        Dictionary<Guid, SecurityEvidencePathWithHops> attackPaths)
    {
        List<Guid> pathIds = attackPaths.Values
            .Where(entry => entry.Path.PathConfidenceBand == PathConfidenceBand.Possible)
            .Select(entry => entry.Path.PathId)
            .ToList();

        if (pathIds.Count == 0)
        {
            return;
        }

        groups.Add(new SecurityEvidencePathReportUnevaluatedGroupResponse
        {
            ReasonCode = SecurityEvidencePathReportReasonCodes.ControlPlaneOnlyNoObservedTraffic,
            WhyText = SecurityEvidencePathReportReasonCatalog.GetWhyText(
                SecurityEvidencePathReportReasonCodes.ControlPlaneOnlyNoObservedTraffic),
            PathCount = pathIds.Count,
            PathIds = pathIds,
        });
    }

    private static void AppendSearchStoppedGroups(
        List<SecurityEvidencePathReportUnevaluatedGroupResponse> groups,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> searchCoverageRows)
    {
        foreach (SecurityEvidencePathSearchCoverageRecord row in searchCoverageRows
                     .OrderBy(row => row.EngineName, StringComparer.Ordinal)
                     .ThenBy(row => row.LimitKind))
        {
            string reasonCode = MapSearchLimitReasonCode(row.LimitKind);
            string whyText = string.Equals(
                row.EngineName,
                SecurityEvidencePathSearchEngineNames.ToxicCombination,
                StringComparison.Ordinal)
                ? SecurityEvidencePathReportReasonCatalog.GetToxicCombinationSearchStoppedWhyText(
                    row.LimitKind,
                    row.LimitValue)
                : SecurityEvidencePathReportReasonCatalog.GetWhyText(reasonCode, row.LimitValue);

            groups.Add(new SecurityEvidencePathReportUnevaluatedGroupResponse
            {
                ReasonCode = reasonCode,
                WhyText = whyText,
                EngineName = SecurityEvidencePathSearchEngineNames.DisplayName(row.EngineName),
                LimitValue = row.LimitValue,
                PathsEmitted = row.PathsEmitted,
            });
        }
    }

    private static string MapSearchLimitReasonCode(SecurityEvidencePathSearchLimitKind limitKind) =>
        limitKind switch
        {
            SecurityEvidencePathSearchLimitKind.MaxPaths => SecurityEvidencePathReportReasonCodes.SearchStoppedMaxPaths,
            SecurityEvidencePathSearchLimitKind.MaxDepth => SecurityEvidencePathReportReasonCodes.SearchStoppedMaxDepth,
            SecurityEvidencePathSearchLimitKind.MaxFanOut => SecurityEvidencePathReportReasonCodes.SearchStoppedMaxFanOut,
            _ => throw new ArgumentOutOfRangeException(nameof(limitKind), limitKind, "Unknown search limit kind."),
        };

    private static bool IsAttackPathKind(PathKind kind) =>
        AttackPathKinds.Contains(kind);

    private static bool IsVulnerableBand(PathConfidenceBand band) =>
        band is PathConfidenceBand.Confirmed
            or PathConfidenceBand.HighlyLikely
            or PathConfidenceBand.Probable;

    private static SecurityEvidencePathRankSummaryResponse MapRankSummary(
        SecurityEvidencePathRankRecord rank,
        SecurityEvidencePathRecord path) =>
        new()
        {
            PathId = rank.PathId,
            SnapshotId = rank.SnapshotId,
            RankOrder = rank.RankOrder,
            RuleVersion = rank.RuleVersion,
            TechnicalExposureScore = rank.TechnicalExposureScore,
            PrivilegeDepthScore = rank.PrivilegeDepthScore,
            BlastRadiusScore = rank.BlastRadiusScore,
            BusinessConsequenceScore = rank.BusinessConsequenceScore,
            ConfidenceBandScore = rank.ConfidenceBandScore,
            CompositeSortScore = rank.CompositeSortScore,
            ExplanationSummary = rank.ExplanationSummary,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            ComputedUtc = rank.ComputedUtc,
            RelatedCutPoints = [],
        };
}
