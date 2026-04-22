namespace ArchLucid.Api.Models;

/// <summary>Body for <c>POST /v1/diagnostics/sponsor-banner-first-commit-badge</c> (operator UI telemetry).</summary>
public sealed class SponsorBannerFirstCommitBadgeRequest
{
    /// <summary>Bucket for <c>archlucid.ui.sponsor_banner.first_commit_badge_rendered</c> (<c>0</c>, <c>1-3</c>, …).</summary>
    public string? DaysSinceFirstCommitBucket
    {
        get;
        init;
    }
}
