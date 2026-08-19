namespace ArchLucid.ReviewApiHarness;

/// <summary>Outcome for one timed, validated journey step.</summary>
public sealed class JourneyStepResult
{
    public required string Name
    {
        get;
        init;
    }

    public required bool Passed
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }

    /// <summary>Wall-clock duration of the step in milliseconds (Stopwatch).</summary>
    public long ElapsedMilliseconds
    {
        get;
        init;
    }

    public string? FailureHint
    {
        get;
        init;
    }

    public IReadOnlyList<string> ValidationErrors
    {
        get;
        init;
    } = [];
}
