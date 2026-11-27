namespace ArchLucid.Core.Analysis;

public static class AnalysisCoverageStates
{
    public const string Complete = "complete";
    public const string Incomplete = "incomplete";
    public const string Failed = "failed";
    public const string Pending = "pending";
    public const string Stale = "stale";
    public const string NotApplicable = "not_applicable";
    public const string Unknown = "unknown";

    public static string FromStageOutcome(string? outcome) => outcome switch
    {
        "succeeded" => Complete,
        "failed" or "timed_out" or "retry_exhausted" or "canceled" => Failed,
        "running" or "retry" or "not_started" => Pending,
        "not_applicable" => NotApplicable,
        _ => Unknown,
    };
}
