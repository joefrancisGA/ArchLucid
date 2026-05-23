namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Canonical funnel event catalog for the first-tenant onboarding telemetry funnel
///     (Improvement 12 / pending question 40). The catalog is the contract between:
///     <list type="bullet">
///         <item>the operator-shell client (<c>archlucid-ui/src/lib/first-tenant-funnel-telemetry.ts</c>),</item>
///         <item>the API ingest (<c>POST /v1/diagnostics/first-tenant-funnel</c>),</item>
///         <item>the application emitter (<c>FirstTenantFunnelEmitter</c>),</item>
///         <item>and the SQL row schema (<c>dbo.FirstTenantFunnelEvents.EventName</c>).</item>
///     </list>
///     Adding or renaming an event requires updating all four surfaces and the privacy notice §3.A.
/// </summary>
public static class FirstTenantFunnelEventNames
{
    /// <summary>New tenant signup persisted (post <c>POST /v1/register</c> 2xx).</summary>
    public const string Signup = "signup";

    /// <summary>Operator clicked "Show me around" — opt-in tour launcher (Q9).</summary>
    public const string TourOptIn = "tour_opt_in";

    /// <summary>First architecture run created via the new-run wizard (post <c>POST /v1/runs</c> 2xx).</summary>
    public const string FirstRunStarted = "first_run_started";

    /// <summary>First architecture run committed to a golden manifest (post commit-run success).</summary>
    public const string FirstRunCommitted = "first_run_committed";

    /// <summary>First finding viewed on the run-detail or finding-detail page.</summary>
    public const string FirstFindingViewed = "first_finding_viewed";

    /// <summary>Operator confirmed finalization — client fires before commit API resolves.</summary>
    public const string FirstFinalizationAttempted = "first_finalization_attempted";

    /// <summary>First deliberate export/download (bundle, traceability, Markdown, etc.).</summary>
    public const string FirstExportOpened = "first_export_opened";

    /// <summary>
    ///     Milestone synthesized on the client (browser): fires when <see cref="FirstFindingViewed" />
    ///     arrives within thirty minutes wall-clock after <see cref="Signup" />. Emitted at most once per browser session.
    /// </summary>
    public const string ThirtyMinuteMilestone = "thirty_minute_milestone";

    /// <summary>Frozen ordered set used for validation and dashboard tile names.</summary>
    public static readonly IReadOnlyList<string> All =
    [
        Signup,
        TourOptIn,
        FirstRunStarted,
        FirstRunCommitted,
        FirstFindingViewed,
        FirstFinalizationAttempted,
        FirstExportOpened,
        ThirtyMinuteMilestone
    ];

    /// <summary>True when <paramref name="value" /> matches a catalog event name.</summary>
    public static bool IsValid(string? value) =>
        !string.IsNullOrWhiteSpace(value) && All.Contains(value, StringComparer.Ordinal);
}
