using System.Globalization;

namespace ArchLucid.Contracts.Roi;

/// <summary>Human-readable sponsor labels paired with <see cref="RoiSponsorFacingScopeCodes"/>.</summary>
public static class RoiSponsorFacingScopeDescriptions
{
    public const string HeadlineDispositionAware =
        "Single-tenant portfolio headline: disposition-aware open + needs-evidence estimated USD from the latest committed run per system (cap 200). Excludes remediated, waived, deferred, and accepted-risk findings.";

    public const string SystemRowSnapshotPotential =
        "Per-system component: estimated USD from each system's latest committed findings snapshot before disposition partitioning. Rows do not sum to the portfolio headline.";

    public const string CrossTenantPortfolioHeadline =
        "Cross-tenant portfolio headline: sums the same disposition-aware open + needs-evidence basis per accessible tenant (k-anonymity ≥ 5). Not comparable to value-report hours ROI.";

    public const string Trailing30DayFindingEvents =
        "Trailing 30-day UTC activity: distinct finding IDs resolved via review trail or discovered on committed runs. Counts only — not USD savings.";

    public const string ValueReportActivityWindowGeneric =
        "Tenant activity window (UTC): architect hours saved and annualized ROI-model USD for the requested period. Distinct from sponsor-report disposition-aware USD headline.";

    public const string PilotScorecardUtcWindowGeneric =
        "Pilot scorecard UTC window: run volume and committed-manifest counts for the period. Does not emit disposition-aware USD headline totals.";

    public const string NonAdditivityCaveat =
        "Per-system rows do not sum to the portfolio headline.";

    public static string ForValueReportWindow(DateTimeOffset periodFromUtc, DateTimeOffset periodToUtc)
    {
        return string.Create(
            CultureInfo.InvariantCulture,
            $"{ValueReportActivityWindowGeneric} Window: {periodFromUtc:O} → {periodToUtc:O}.");
    }

    public static string ForPilotScorecardWindow(DateTimeOffset periodStart, DateTimeOffset periodEnd)
    {
        return string.Create(
            CultureInfo.InvariantCulture,
            $"{PilotScorecardUtcWindowGeneric} Window: {periodStart:O} → {periodEnd:O}.");
    }
}
