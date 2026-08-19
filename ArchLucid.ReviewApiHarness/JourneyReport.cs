namespace ArchLucid.ReviewApiHarness;

/// <summary>Aggregate report for the full-operator review API journey.</summary>
public sealed class JourneyReport
{
    public required IReadOnlyList<JourneyStepResult> Steps
    {
        get;
        init;
    }

    public required bool AllPassed
    {
        get;
        init;
    }

    public string? RunId
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? FinalRunStatus
    {
        get;
        init;
    }

    public string? ManifestVersion
    {
        get;
        init;
    }

    public string? ApprovalRequestId
    {
        get;
        init;
    }

    public long TotalLlmTokens
    {
        get;
        init;
    }

    public string? StructuralExecutionMode
    {
        get;
        init;
    }

    public long TotalElapsedMilliseconds
    {
        get;
        init;
    }
}
