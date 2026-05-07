namespace ArchLucid.Application.ExecDigest;
/// <summary>Immutable weekly digest payload assembled from existing read services.</summary>
public sealed record ExecDigestComposition(string WeekLabel, string? ComplianceDriftMarkdown, int? CommittedManifestsInWeek, IReadOnlyList<ExecDigestHighlightedRun> TopManifestRuns, string? FindingsDeltaSummary, string DashboardUrl, string SponsorValueReportUrl, string? LatestCommittedRunIdHex)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(WeekLabel, ComplianceDriftMarkdown, TopManifestRuns, FindingsDeltaSummary, DashboardUrl, SponsorValueReportUrl, LatestCommittedRunIdHex);
    private static byte __ValidatePrimaryConstructorArguments(System.String weekLabel, System.String? complianceDriftMarkdown, System.Collections.Generic.IReadOnlyList<ArchLucid.Application.ExecDigest.ExecDigestHighlightedRun> topManifestRuns, System.String? findingsDeltaSummary, System.String dashboardUrl, System.String sponsorValueReportUrl, System.String? latestCommittedRunIdHex)
    {
        ArgumentNullException.ThrowIfNull(weekLabel);
        ArgumentNullException.ThrowIfNull(topManifestRuns);
        ArgumentNullException.ThrowIfNull(dashboardUrl);
        ArgumentNullException.ThrowIfNull(sponsorValueReportUrl);
        return (byte)0;
    }
}