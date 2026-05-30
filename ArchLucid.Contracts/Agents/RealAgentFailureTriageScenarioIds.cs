namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Stable scenario identifiers for real-agent failure triage (assessment improvement #23).
///     Used in run failure metadata and operator runbooks without embedding secrets or raw LLM text.
/// </summary>
public static class RealAgentFailureTriageScenarioIds
{
    public const string MissingCredentials = "missingCredentials";

    public const string ContentSafetyRejection = "contentSafetyRejection";

    public const string SchemaViolation = "schemaViolation";

    public const string GroundingInsufficiency = "groundingInsufficiency";

    public const string Timeout = "timeout";

    public const string BudgetCutoff = "budgetCutoff";

    public const string FallbackToSimulator = "fallbackToSimulator";

    /// <summary>All scenarios required for assessment #23 acceptance (order-stable for docs/CI).</summary>
    public static IReadOnlyList<string> AllRequired { get; } =
    [
        MissingCredentials,
        ContentSafetyRejection,
        SchemaViolation,
        GroundingInsufficiency,
        Timeout,
        BudgetCutoff,
        FallbackToSimulator,
    ];
}
