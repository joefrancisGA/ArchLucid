using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Notifications;

/// <summary>Anonymous read-only sponsor payload for digest deep links (TB-2196).</summary>
public sealed class ExecDigestSponsorDeepLinkViewResponse
{
    public string Target { get; init; } = string.Empty;

    public string WeekLabel { get; init; } = string.Empty;

    public int? CommittedManifestsInWeek { get; init; }

    private IReadOnlyList<ExecDigestSponsorDeepLinkHighlightedRunDto> topRuns = [];

    public IReadOnlyList<ExecDigestSponsorDeepLinkHighlightedRunDto> TopRuns
    {
        get => topRuns;
        init => topRuns = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string? ComplianceDriftMarkdown { get; init; }

    public string? FindingsDeltaSummary { get; init; }

    public string? DecisionNeededMarkdown { get; init; }

    public string? RunIdHex { get; init; }

    public string? RunSummaryMarkdown { get; init; }

    public string SignInUrl { get; init; } = string.Empty;

    /// <summary>CG-037 — body disclaimer when any highlighted run requires rehearsal honesty.</summary>
    public string? RehearsalBodyDisclaimer { get; init; }
}
