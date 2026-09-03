using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <inheritdoc cref="IExplanationSignalStage" />
public sealed class ExplanationSignalStage(IDeterministicExplanationService deterministic) : IExplanationSignalStage
{
    private readonly IDeterministicExplanationService _deterministic =
        deterministic ?? throw new ArgumentNullException(nameof(deterministic));

    /// <inheritdoc />
    public ComparisonExplanationSignals ExtractComparisonSignals(ComparisonResult comparison)
    {
        ArgumentNullException.ThrowIfNull(comparison);

        List<string> majorChanges = _deterministic.ExtractMajorChanges(comparison);
        string securityBlock = _deterministic.FormatSecurityChanges(comparison);
        string costBlock = _deterministic.FormatCostChanges(comparison);
        string topologyBlock = _deterministic.FormatTopologyChanges(comparison);
        string reqBlock = _deterministic.FormatRequirementChanges(comparison);

        string userPrompt =
            "Explain the following architecture changes between a BASE run and a TARGET run.\n\n" +
            "## Summary counts\n" +
            $"- Decision deltas: {comparison.DecisionChanges.Count}\n" +
            $"- Requirement deltas: {comparison.RequirementChanges.Count}\n" +
            $"- Security deltas: {comparison.SecurityChanges.Count}\n" +
            $"- Topology deltas: {comparison.TopologyChanges.Count}\n" +
            $"- Cost deltas: {comparison.CostChanges.Count}\n\n" +
            "## Decision / choice changes\n" + string.Join("\n", majorChanges) + "\n\n" +
            "## Requirement changes\n" + reqBlock + "\n\n" +
            "## Security changes\n" + securityBlock + "\n\n" +
            "## Topology changes\n" + topologyBlock + "\n\n" +
            "## Cost changes\n" + costBlock + "\n\n" +
            "## Highlight strings\n" + string.Join("\n", comparison.SummaryHighlights.Select(h => "- " + h)) +
            "\n\n" +
            "Respond with a single JSON object only (no markdown fences), keys:\n" +
            "highLevelSummary (string), keyTradeoffs (array of strings), narrative (string, 2-4 short paragraphs).";

        return new ComparisonExplanationSignals(majorChanges, userPrompt);
    }

    /// <inheritdoc />
    public RunExplanationSignals ExtractRunSignals(
        ManifestDocument manifest,
        DecisionProvenanceGraph? provenance)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        List<string> keyDrivers = _deterministic.ExtractRunKeyDrivers(manifest, provenance);
        List<string> risks = _deterministic.ExtractRiskImplications(manifest);
        List<string> costs = _deterministic.ExtractCostImplications(manifest);
        List<string> compliance = _deterministic.ExtractComplianceImplications(manifest);

        string userPrompt =
            "Explain this architecture run for stakeholders.\n\n" +
            "## Manifest summary (source of truth)\n" +
            (string.IsNullOrWhiteSpace(manifest.Metadata.Summary)
                ? "(none)\n"
                : manifest.Metadata.Summary + "\n") +
            "\n## Key drivers (must be reflected in your reasoning)\n" +
            string.Join("\n", keyDrivers.Select(x => "- " + x)) +
            "\n\n## Risks / issues (from manifest)\n" +
            string.Join("\n", risks.Select(x => "- " + x)) +
            "\n\n## Cost signals\n" +
            string.Join("\n", costs.Select(x => "- " + x)) +
            "\n\n## Compliance signals\n" +
            string.Join("\n", compliance.Select(x => "- " + x)) +
            "\n\n## Provenance\n" +
            _deterministic.FormatProvenanceSummary(provenance) +
            "\n\n" +
            StructuredExplanationLlmPromptSchema.BuildRunExplanationJsonResponseInstructions(
                "2–4 paragraphs referencing the bullets above");

        return new RunExplanationSignals(keyDrivers, risks, costs, compliance, userPrompt);
    }
}
