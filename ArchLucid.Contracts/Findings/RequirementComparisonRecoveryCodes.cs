namespace ArchLucid.Contracts.Findings;

/// <summary>Stable terminal outcomes from the read-only requirement comparison retry lane.</summary>
public static class RequirementComparisonRecoveryCodes
{
    public const string EngineType = "requirement-cross-run-diff";
    public const string NoFindings = "completed_no_findings";
    public const string WithFindings = "completed_with_findings";
    public const string RecoveredNoFindings = "recovered_no_findings";
    public const string RecoveredWithFindings = "recovered_with_findings";
    public const string RetryExhausted = "retry_exhausted";
    public const string RetryStopped = "retry_stopped";
}
