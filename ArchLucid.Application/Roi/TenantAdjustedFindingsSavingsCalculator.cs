using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Recomputes <see cref="FindingsSnapshot.TotalEstimatedSavings" /> using tenant-specific architect hourly rate and
///     incident cost instead of the platform defaults baked into persisted <see cref="Finding.ProjectedImpactUsd" /> values.
/// </summary>
public static class TenantAdjustedFindingsSavingsCalculator
{
    /// <summary>
    ///     When no tenant row exists, returns the persisted snapshot total unchanged. When settings exist, scales each
    ///     accepted finding's <see cref="Finding.ProjectedImpactUsd" /> by the ratio of tenant vs default assumptions.
    /// </summary>
    public static decimal ComputeTotal(
        FindingsSnapshot snapshot,
        TenantCostSettingsRecord? tenantSettings,
        ValueReportComputationOptions defaults)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(defaults);

        if (tenantSettings is null)
            return snapshot.TotalEstimatedSavings;

        if (snapshot.Findings.Count == 0)
            return 0m;

        decimal defaultHourly = defaults.FullyLoadedArchitectHourlyUsd;
        decimal defaultIncident = defaults.DefaultAverageIncidentCostUsd;

        if (defaultHourly <= 0m || defaultIncident <= 0m)
            return FindingsSnapshotEstimatedSavingsCalculator.ComputeTotal(snapshot.Findings);

        decimal hourlyScale = tenantSettings.ArchitectHourlyRateUsd / defaultHourly;
        decimal incidentScale = tenantSettings.AverageIncidentCostUsd / defaultIncident;

        decimal total = 0m;

        foreach (Finding finding in snapshot.Findings)
        {
            if (finding.ProjectedImpactUsd is not decimal impact)
                continue;

            bool isCostCategory = string.Equals(finding.Category, "Cost", StringComparison.OrdinalIgnoreCase);

            if (isCostCategory)
            {
                if (!IsAcceptedCostFinding(finding))
                    continue;

                total += decimal.Round(impact * hourlyScale, 2, MidpointRounding.AwayFromZero);
                continue;
            }

            if (!IsAcceptedNonCostFinding(finding))
                continue;

            total += decimal.Round(impact * incidentScale, 2, MidpointRounding.AwayFromZero);
        }

        return total;
    }

    private static bool IsAcceptedCostFinding(Finding finding) =>
        finding.HumanReviewStatus is FindingHumanReviewStatus.Approved
            or FindingHumanReviewStatus.NotRequired;

    private static bool IsAcceptedNonCostFinding(Finding finding) =>
        finding.HumanReviewStatus is FindingHumanReviewStatus.Approved
            or FindingHumanReviewStatus.NotRequired;
}
