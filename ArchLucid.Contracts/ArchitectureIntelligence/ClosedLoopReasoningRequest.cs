namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClosedLoopReasoningRequest
{
    public string TenantId
    {
        get;
        set;
    } = null!;

    public string? RunId
    {
        get;
        set;
    }

    public string? WorkspaceId
    {
        get;
        set;
    }

    public string? ProjectId
    {
        get;
        set;
    }

    public List<ClosedLoopReasoningSourceText> SourceTexts
    {
        get;
        set;
    } = [];

    public List<string> DeclaredPriorities
    {
        get;
        set;
    } = [];

    /// <summary>
    /// Operator answers to framing / evidence-driven interview questions (questionId → answer).
    /// Merged into the model before review on re-run (TB-1980 round-trip).
    /// </summary>
    public Dictionary<string, string> FramingAnswers
    {
        get;
        set;
    } = new();

    /// <summary>
    /// When true and source texts are empty, the API may substitute the golden incomplete fixture.
    /// </summary>
    public bool UseGoldenFixture
    {
        get;
        set;
    }

    /// <summary>
    /// When true with <see cref="RunId"/>, load the latest persisted model for that run and skip re-extraction.
    /// </summary>
    public bool ContinueFromExistingRun
    {
        get;
        set;
    }

    /// <summary>
    /// When true, publish gated product findings/recommendations into findings + advisory stores.
    /// </summary>
    public bool PublishToProduct
    {
        get;
        set;
    }

    /// <summary>
    /// Review depth for TB-1992 per-tier estimated-token budgets. Defaults to <see cref="ArchitectureIntelligenceReviewTier.Standard"/>.
    /// </summary>
    public ArchitectureIntelligenceReviewTier ReviewTier
    {
        get;
        set;
    } = ArchitectureIntelligenceReviewTier.Standard;
}
