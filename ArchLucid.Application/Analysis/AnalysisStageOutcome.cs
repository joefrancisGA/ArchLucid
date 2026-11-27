namespace ArchLucid.Application.Analysis;

/// <summary>Stable stage status values. Existing Authority timeline states remain valid.</summary>
internal static class AnalysisStageOutcome
{
    public const string Succeeded = "succeeded";
    public const string CheckpointReused = "skipped";
    public const string Failed = "failed";
    public const string TimedOut = "timed_out";
    public const string Canceled = "canceled";
    public const string RetryExhausted = "retry_exhausted";
    public const string NotStarted = "not_started";
}
