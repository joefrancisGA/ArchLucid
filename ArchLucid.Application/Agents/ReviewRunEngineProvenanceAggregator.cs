using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Aggregates persisted agent execution traces and run context into run-level
///     <see cref="ReviewRunEngineProvenance" />.
/// </summary>
public static class ReviewRunEngineProvenanceAggregator
{
    public static ReviewRunEngineProvenance Aggregate(
        IReadOnlyList<AgentExecutionTrace> traces,
        AgentEvidencePackage evidence,
        RunRecord run,
        FindingsSnapshot? findingsSnapshot,
        ILlmCostEstimator costEstimator)
    {
        ArgumentNullException.ThrowIfNull(traces);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(costEstimator);

        AgentExecutionTraceRunLlmCostSummary costSummary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, costEstimator);

        long reasoningTokens = 0;

        foreach (AgentExecutionTrace trace in traces)
            reasoningTokens += trace.ReasoningTokenCount ?? 0;

        int? inputTokens = costSummary.PromptTokens > 0 ? (int)Math.Min(costSummary.PromptTokens, int.MaxValue) : null;
        long combinedOutputTokens = costSummary.CompletionTokens + reasoningTokens;
        int? outputTokens = combinedOutputTokens > 0
            ? (int)Math.Min(combinedOutputTokens, int.MaxValue)
            : null;

        return new ReviewRunEngineProvenance
        {
            ProviderKind = DeriveProviderKind(traces, run.StructuralExecutionMode),
            DeploymentOrModelId = costSummary.ModelLabel,
            PromptPackVersion = DerivePromptPackVersion(traces),
            PolicyPackVersion = DerivePolicyPackVersion(evidence),
            EvidenceSnapshotVersion = run.ContextSnapshotId?.ToString("D"),
            OutputSchemaVersion = DeriveOutputSchemaVersion(findingsSnapshot),
            RunTimestampUtc = run.CreatedUtc,
            TotalInputTokens = inputTokens,
            TotalOutputTokens = outputTokens,
            EstimatedCostUsd = costSummary.EstimatedCostUsd,
            EngineProfileId = DeriveEngineProfileId(run.StructuralExecutionMode),
        };
    }

    private static string DeriveProviderKind(
        IReadOnlyList<AgentExecutionTrace> traces,
        StructuralExecutionMode structuralExecutionMode)
    {
        if (traces.Count == 0)
        {
            if (structuralExecutionMode == StructuralExecutionMode.Simulator)
                return "deterministic";

            return "azure-openai";
        }

        if (traces.All(static trace =>
                string.Equals(
                    trace.ModelDeploymentName,
                    AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
                    StringComparison.Ordinal)))
        {
            return "deterministic";
        }

        return "azure-openai";
    }

    private static string? DerivePromptPackVersion(IReadOnlyList<AgentExecutionTrace> traces)
    {
        HashSet<string> labels = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentExecutionTrace trace in traces)
        {
            if (!string.IsNullOrWhiteSpace(trace.PromptReleaseLabel))
            {
                labels.Add(trace.PromptReleaseLabel.Trim());
                continue;
            }

            if (!string.IsNullOrWhiteSpace(trace.PromptTemplateId)
                && !string.IsNullOrWhiteSpace(trace.PromptTemplateVersion))
            {
                labels.Add($"{trace.PromptTemplateId.Trim()} v{trace.PromptTemplateVersion.Trim()}");
            }
        }

        if (labels.Count == 0)
            return null;

        return string.Join(", ", labels.Order(StringComparer.Ordinal));
    }

    private static string? DerivePolicyPackVersion(AgentEvidencePackage evidence)
    {
        if (evidence.Policies.Count == 0)
            return null;

        IEnumerable<string> titles = evidence.Policies
            .Select(static policy => policy.Title)
            .Where(static title => !string.IsNullOrWhiteSpace(title))
            .Select(static title => title.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.Ordinal);

        List<string> materialized = titles.ToList();

        return materialized.Count == 0 ? null : string.Join(", ", materialized);
    }

    private static string? DeriveOutputSchemaVersion(FindingsSnapshot? findingsSnapshot)
    {
        if (findingsSnapshot is null)
            return null;

        return $"FindingsSnapshot v{findingsSnapshot.SchemaVersion}";
    }

    private static string? DeriveEngineProfileId(StructuralExecutionMode structuralExecutionMode)
    {
        return structuralExecutionMode switch
        {
            StructuralExecutionMode.Simulator => "deterministic-simulator",
            StructuralExecutionMode.Real => "azure-openai-default",
            StructuralExecutionMode.Fallback => "azure-openai-with-fallback",
            StructuralExecutionMode.Mixed => "mixed",
            _ => null,
        };
    }
}
