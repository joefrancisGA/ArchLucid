using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <summary>Extracts deterministic explanation signals used to build LLM prompts.</summary>
public interface IExplanationSignalStage
{
    ComparisonExplanationSignals ExtractComparisonSignals(ComparisonResult comparison);

    RunExplanationSignals ExtractRunSignals(
        ManifestDocument manifest,
        DecisionProvenanceGraph? provenance);
}
