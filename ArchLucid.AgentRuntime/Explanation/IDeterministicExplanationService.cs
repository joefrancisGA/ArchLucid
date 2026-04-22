using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation;

/// <summary>
///     Signal-only (non-LLM) explanation building: manifest/comparison heuristics and LLM JSON fallbacks.
/// </summary>
public interface IDeterministicExplanationService
{
    /// <summary>Builds a comparison explanation, using LLM JSON when present and heuristics otherwise.</summary>
    ComparisonExplanationResult BuildComparisonExplanation(
        ComparisonResult comparison,
        List<string> majorChanges,
        string? llmJson);

    /// <summary>Parses LLM JSON (or prose) into a run <see cref="ExplanationResult" /> with heuristic fallbacks.</summary>
    ExplanationResult BuildRunExplanationFromLlmPayload(
        GoldenManifest manifest,
        List<string> keyDrivers,
        List<string> risks,
        List<string> costs,
        List<string> compliance,
        string rawStored);

    /// <summary>Extracts comparison deltas as human-readable lines.</summary>
    List<string> ExtractMajorChanges(ComparisonResult comparison);

    /// <summary>Formats requirement deltas for prompts.</summary>
    string FormatRequirementChanges(ComparisonResult comparison);

    /// <summary>Formats security deltas for prompts.</summary>
    string FormatSecurityChanges(ComparisonResult comparison);

    /// <summary>Formats topology deltas for prompts.</summary>
    string FormatTopologyChanges(ComparisonResult comparison);

    /// <summary>Formats cost deltas for prompts.</summary>
    string FormatCostChanges(ComparisonResult comparison);

    /// <summary>Key manifest drivers for prompts.</summary>
    List<string> ExtractRunKeyDrivers(GoldenManifest manifest, DecisionProvenanceGraph? provenance);

    /// <summary>Risk/issue lines for prompts.</summary>
    List<string> ExtractRiskImplications(GoldenManifest manifest);

    /// <summary>Cost lines for prompts.</summary>
    List<string> ExtractCostImplications(GoldenManifest manifest);

    /// <summary>Compliance lines for prompts.</summary>
    List<string> ExtractComplianceImplications(GoldenManifest manifest);

    /// <summary>Short provenance summary for prompts.</summary>
    string FormatProvenanceSummary(DecisionProvenanceGraph? graph);
}
