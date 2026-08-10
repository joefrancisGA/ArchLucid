namespace ArchLucid.ReviewApiHarness;

/// <summary>Timed HTTP step outcome including optional JSON payload text.</summary>
public sealed class TimedHttpResult
{
    public required JourneyStepResult Step
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    /// <summary>Raw JSON body when the step returned a validated JSON document.</summary>
    public string? RawJson
    {
        get;
        init;
    }

    public static TimedHttpResult Succeeded(
        string name,
        long elapsedMs,
        string detail,
        string? correlationId,
        string? rawJson,
        IReadOnlyList<string> validationErrors)
    {
        return new TimedHttpResult
        {
            Step = new JourneyStepResult
            {
                Name = name,
                Passed = true,
                Detail = detail,
                ElapsedMilliseconds = elapsedMs,
                ValidationErrors = validationErrors
            },
            CorrelationId = correlationId,
            RawJson = rawJson
        };
    }

    public static TimedHttpResult Failed(
        string name,
        long elapsedMs,
        string detail,
        string? correlationId,
        string? rawJson,
        string? failureHint = null,
        IReadOnlyList<string>? validationErrors = null)
    {
        return new TimedHttpResult
        {
            Step = new JourneyStepResult
            {
                Name = name,
                Passed = false,
                Detail = detail,
                ElapsedMilliseconds = elapsedMs,
                FailureHint = failureHint,
                ValidationErrors = validationErrors ?? []
            },
            CorrelationId = correlationId,
            RawJson = rawJson
        };
    }
}
