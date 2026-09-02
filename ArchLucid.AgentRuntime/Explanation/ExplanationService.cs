using ArchLucid.AgentRuntime.Explanation.Stages;
using ArchLucid.Application.Explanation;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation;

/// <summary>
///     Structured signals first, then LLM narrative (JSON). Falls back to signal-only text if the model fails.
/// </summary>
/// <inheritdoc cref="IExplanationService" />
public sealed class ExplanationService(
    IExplanationSignalStage signalStage,
    IExplanationLlmNarrativeStage llmNarrativeStage,
    IExplanationFallbackStage fallbackStage) : IExplanationService
{
    private readonly IExplanationSignalStage _signalStage =
        signalStage ?? throw new ArgumentNullException(nameof(signalStage));

    private readonly IExplanationLlmNarrativeStage _llmNarrativeStage =
        llmNarrativeStage ?? throw new ArgumentNullException(nameof(llmNarrativeStage));

    private readonly IExplanationFallbackStage _fallbackStage =
        fallbackStage ?? throw new ArgumentNullException(nameof(fallbackStage));

    /// <inheritdoc />
    public async Task<ComparisonExplanationResult> ExplainComparisonAsync(
        ComparisonResult comparison,
        CancellationToken ct)
    {
        ComparisonExplanationSignals signals = _signalStage.ExtractComparisonSignals(comparison);
        string? json = await _llmNarrativeStage.CompleteAndValidateComparisonAsync(signals.UserPrompt, ct);

        return _fallbackStage.BuildComparisonExplanation(comparison, signals, json);
    }

    /// <inheritdoc />
    public async Task<ExplanationResult> ExplainRunAsync(
        ManifestDocument manifest,
        DecisionProvenanceGraph? provenance,
        CancellationToken ct)
    {
        RunExplanationSignals signals = _signalStage.ExtractRunSignals(manifest, provenance);
        string? json = await _llmNarrativeStage.CompleteAndValidateRunAsync(signals.UserPrompt, ct);
        string rawStored = json ?? string.Empty;

        ExplanationResult result = _fallbackStage.BuildRunExplanation(manifest, signals, rawStored);

        return _fallbackStage.FinalizeRunExplanation(result);
    }
}
