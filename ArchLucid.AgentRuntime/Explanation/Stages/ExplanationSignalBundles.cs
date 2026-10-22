using ArchLucid.Core.Comparison;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <summary>Deterministic comparison signals extracted before LLM narrative completion.</summary>
public sealed record ComparisonExplanationSignals(
    List<string> MajorChanges,
    string UserPrompt);

/// <summary>Deterministic run signals extracted before LLM narrative completion.</summary>
public sealed record RunExplanationSignals(
    List<string> KeyDrivers,
    List<string> Risks,
    List<string> Costs,
    List<string> Compliance,
    string UserPrompt);
