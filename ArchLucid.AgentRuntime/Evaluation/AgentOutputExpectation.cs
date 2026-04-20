using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
/// Expected shape and quality bar for evaluating an in-memory <see cref="AgentResult"/> (tests, harnesses, offline QA).
/// </summary>
public sealed class AgentOutputExpectation
{
    /// <summary>Each listed category must appear on at least one finding (case-insensitive trim). Empty = no category requirement.</summary>
    public IReadOnlyList<string> ExpectedFindingCategories { get; init; } = [];

    /// <summary>Minimum number of findings on the result.</summary>
    public int MinimumFindingCount
    {
        get; init;
    }

    /// <summary>Additional JSON property names required on the serialized <see cref="AgentResult"/> root object.</summary>
    public IReadOnlyList<string> RequiredJsonKeys { get; init; } = [];

    /// <summary>Minimum <see cref="AgentOutputSemanticScore.OverallSemanticScore"/> (0–1). Zero skips the check.</summary>
    public double MinimumSemanticScore
    {
        get; init;
    }

    /// <summary>Minimum <see cref="AgentOutputEvaluationScore.StructuralCompletenessRatio"/> (0–1). Zero skips the check.</summary>
    public double MinimumStructuralCompleteness
    {
        get; init;
    }
}
