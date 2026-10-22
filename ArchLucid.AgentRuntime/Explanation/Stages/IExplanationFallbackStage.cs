using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <summary>Builds deterministic fallback narratives when LLM JSON is absent or invalid.</summary>
public interface IExplanationFallbackStage
{
    ComparisonExplanationResult BuildComparisonExplanation(
        ComparisonResult comparison,
        ComparisonExplanationSignals signals,
        string? llmJson);

    ExplanationResult BuildRunExplanation(
        ManifestDocument manifest,
        RunExplanationSignals signals,
        string rawStored);

    ExplanationResult FinalizeRunExplanation(ExplanationResult result);
}
