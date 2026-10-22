namespace ArchLucid.ReviewApiHarness;

/// <summary>Parsed CLI options for the full-operator review journey.</summary>
public sealed class JourneyOptions
{
    public const int DefaultTimeoutSeconds = 900;

    public const int DefaultPollIntervalSeconds = 3;

    public const string DefaultSubmitterActorName = "Developer";

    public const string DefaultSubmitterActorId = "dev-user";

    public const string DefaultReviewerActorName = "e2e-peer-reviewer";

    public const string DefaultReviewerActorId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    public required string ApiBaseUrl
    {
        get;
        init;
    }

    public string? ArchitectureRequestJsonPath
    {
        get;
        init;
    }

    public string? JsonOutPath
    {
        get;
        init;
    }

    public int TimeoutSeconds
    {
        get;
        init;
    } = DefaultTimeoutSeconds;

    public int PollIntervalSeconds
    {
        get;
        init;
    } = DefaultPollIntervalSeconds;

    public string SubmitterActorName
    {
        get;
        init;
    } = DefaultSubmitterActorName;

    public string SubmitterActorId
    {
        get;
        init;
    } = DefaultSubmitterActorId;

    public string ReviewerActorName
    {
        get;
        init;
    } = DefaultReviewerActorName;

    public string ReviewerActorId
    {
        get;
        init;
    } = DefaultReviewerActorId;

    /// <summary>
    ///     Optional OpenAPI snapshot override. Defaults to the bundled contract snapshot beside the executable.
    /// </summary>
    public string? OpenApiSnapshotPath
    {
        get;
        init;
    }

    /// <summary>
    ///     When <see langword="false" />, mocked journeys may pass the real-AI gate without persisted LLM token totals.
    /// </summary>
    public bool RequireNonZeroLlmTokens
    {
        get;
        init;
    } = true;
}
