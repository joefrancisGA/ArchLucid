using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Exports;

namespace ArchLucid.Application.Notifications.Email.Models;

/// <summary>Razor model for <c>Templates/ExecDigest.cshtml</c>.</summary>
public sealed class ExecDigestEmailModel
{
    public string ProductName
    {
        get;
        init;
    } = "ArchLucid";

    public string WeekLabel
    {
        get;
        init;
    } = string.Empty;

    public string? ComplianceDriftMarkdown
    {
        get;
        init;
    }

    public int? CommittedManifestsInWeek
    {
        get;
        init;
    }

    public IReadOnlyList<ExecDigestHighlightedRun> TopRuns
    {
        get;
        init;
    } = [];

    public string? FindingsDeltaSummary
    {
        get;
        init;
    }

    public string DashboardUrl
    {
        get;
        init;
    } = string.Empty;

    public string SponsorValueReportUrl
    {
        get;
        init;
    } = string.Empty;

    public string UnsubscribeUrl
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Optional absolute URL to a PNG logo (same host as <see cref="DashboardUrl" />).</summary>
    public string? LogoImageUrl
    {
        get;
        init;
    }

    /// <summary>CG-037 — prepended to subject when every committed run in the digest window is rehearsal.</summary>
    public string? RehearsalSubjectPrefix
    {
        get;
        init;
    }

    /// <summary>CG-037 — body disclaimer when any committed run in the digest window requires rehearsal honesty.</summary>
    public string? RehearsalBodyDisclaimer
    {
        get;
        init;
    }

    public string SponsorRoiNonSummingLine { get; init; } =
        SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine;

    public string PolicyPackInfluenceHonestyLine { get; init; } =
        SendableExportCoverComposer.PolicyPackInfluenceHonestyLine;
}
