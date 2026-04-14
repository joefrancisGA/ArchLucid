using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Outcome of <see cref="IAgentOutputEvaluationHarness.Evaluate"/>.</summary>
public sealed class AgentOutputHarnessResult
{
    /// <summary>True when <see cref="Failures"/> is empty and JSON structural parse succeeded where required.</summary>
    public bool Passed { get; init; }

    /// <summary>Structural score from <see cref="IAgentOutputEvaluator"/>.</summary>
    public double StructuralCompletenessRatio { get; init; }

    /// <summary>Semantic score from <see cref="IAgentOutputSemanticEvaluator"/>.</summary>
    public double SemanticScore { get; init; }

    /// <summary>Share of <see cref="AgentOutputExpectation.ExpectedFindingCategories"/> matched by at least one finding.</summary>
    public double CategoryCoverageRatio { get; init; }

    /// <summary>Human-readable reasons when <see cref="Passed"/> is false.</summary>
    public IReadOnlyList<string> Failures { get; init; } = [];

    /// <summary>Agent type under test.</summary>
    public AgentType AgentType { get; init; }
}
