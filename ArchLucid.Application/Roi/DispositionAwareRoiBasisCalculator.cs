using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Partitions projected finding USD by latest disposition and active waivers (Batch B).</summary>
internal static class DispositionAwareRoiBasisCalculator
{
    internal static ExecutiveRoiBasisBreakdown Compute(
        IReadOnlyList<FindingsSnapshot> snapshots,
        IReadOnlyList<FindingReviewEventRecord> dispositionEvents,
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        TenantCostSettingsRecord? tenantSettings,
        ValueReportComputationOptions defaults)
    {
        ArgumentNullException.ThrowIfNull(snapshots);
        ArgumentNullException.ThrowIfNull(dispositionEvents);
        ArgumentNullException.ThrowIfNull(activeWaivers);
        ArgumentNullException.ThrowIfNull(defaults);

        Dictionary<string, FindingDisposition> latestDisposition = BuildLatestDispositionMap(dispositionEvents);
        HashSet<string> waivedFindingIds = activeWaivers
            .Select(static w => w.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        decimal openUsd = 0m;
        decimal acceptedUsd = 0m;
        decimal needsEvidenceUsd = 0m;
        decimal deferredUsd = 0m;
        decimal waivedUsd = 0m;
        decimal realizedUsd = 0m;
        decimal rejectedUsd = 0m;

        foreach (FindingsSnapshot snapshot in snapshots)
        {
            if (snapshot.Findings.Count == 0)
                continue;

            foreach (Finding finding in snapshot.Findings)
            {
                if (!TryResolveAdjustedImpactUsd(finding, tenantSettings, defaults, out decimal impact))
                    continue;

                string findingId = finding.FindingId.Trim();

                if (waivedFindingIds.Contains(findingId))
                {
                    waivedUsd += impact;
                    continue;
                }

                if (!latestDisposition.TryGetValue(findingId, out FindingDisposition disposition))
                {
                    openUsd += impact;
                    continue;
                }

                switch (disposition)
                {
                    case FindingDisposition.Accepted:
                        acceptedUsd += impact;
                        break;
                    case FindingDisposition.NeedsEvidence:
                        needsEvidenceUsd += impact;
                        break;
                    case FindingDisposition.Deferred:
                        deferredUsd += impact;
                        break;
                    case FindingDisposition.Remediated:
                        realizedUsd += impact;
                        break;
                    case FindingDisposition.RejectedAsNotApplicable:
                        rejectedUsd += impact;
                        break;
                    default:
                        openUsd += impact;
                        break;
                }
            }
        }

        decimal totalPotential = openUsd + acceptedUsd + needsEvidenceUsd + deferredUsd + waivedUsd;

        return new ExecutiveRoiBasisBreakdown
        {
            OpenEstimatedUsd = decimal.Round(openUsd, 2, MidpointRounding.AwayFromZero),
            AcceptedRiskUsd = decimal.Round(acceptedUsd, 2, MidpointRounding.AwayFromZero),
            NeedsEvidenceUsd = decimal.Round(needsEvidenceUsd, 2, MidpointRounding.AwayFromZero),
            DeferredUsd = decimal.Round(deferredUsd, 2, MidpointRounding.AwayFromZero),
            WaivedUsd = decimal.Round(waivedUsd, 2, MidpointRounding.AwayFromZero),
            RealizedUsd = decimal.Round(realizedUsd, 2, MidpointRounding.AwayFromZero),
            RejectedNotApplicableUsd = decimal.Round(rejectedUsd, 2, MidpointRounding.AwayFromZero),
            TotalPotentialUsd = decimal.Round(totalPotential, 2, MidpointRounding.AwayFromZero),
        };
    }

    private static Dictionary<string, FindingDisposition> BuildLatestDispositionMap(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        Dictionary<string, FindingDisposition> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord reviewEvent in events.OrderBy(static e => e.OccurredAtUtc))
        {
            if (reviewEvent.Disposition is null)
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            map[reviewEvent.FindingId.Trim()] = reviewEvent.Disposition.Value;
        }

        return map;
    }

    private static bool TryResolveAdjustedImpactUsd(
        Finding finding,
        TenantCostSettingsRecord? tenantSettings,
        ValueReportComputationOptions defaults,
        out decimal impact)
    {
        impact = 0m;

        if (finding.ProjectedImpactUsd is not decimal projected)
            return false;

        bool isCost = string.Equals(finding.Category, "Cost", StringComparison.OrdinalIgnoreCase);

        if (isCost)
        {
            if (!TenantAdjustedFindingsSavingsCalculator.IsAcceptedCostFindingPublic(finding))
                return false;
        }
        else
        {
            if (!TenantAdjustedFindingsSavingsCalculator.IsAcceptedNonCostFindingPublic(finding))
                return false;
        }

        if (tenantSettings is null)
        {
            impact = projected;
            return impact > 0m;
        }

        decimal defaultHourly = defaults.FullyLoadedArchitectHourlyUsd;
        decimal defaultIncident = defaults.DefaultAverageIncidentCostUsd;

        if (defaultHourly <= 0m || defaultIncident <= 0m)
        {
            impact = projected;
            return impact > 0m;
        }

        if (isCost)
        {
            decimal hourlyScale = tenantSettings.ArchitectHourlyRateUsd / defaultHourly;
            impact = projected * hourlyScale * tenantSettings.EaDiscountMultiplier;
        }
        else
        {
            decimal incidentScale = tenantSettings.AverageIncidentCostUsd / defaultIncident;
            impact = projected * incidentScale;
        }

        impact = decimal.Round(impact, 2, MidpointRounding.AwayFromZero);

        return impact > 0m;
    }
}
