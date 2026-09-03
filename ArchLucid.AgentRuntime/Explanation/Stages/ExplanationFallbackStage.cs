using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <inheritdoc cref="IExplanationFallbackStage" />
public sealed class ExplanationFallbackStage(
    IDeterministicExplanationService deterministic,
    IAgentCompletionClient completionClient,
    IOptions<ExplanationServiceOptions> explanationOptions) : IExplanationFallbackStage
{
    private readonly IDeterministicExplanationService _deterministic =
        deterministic ?? throw new ArgumentNullException(nameof(deterministic));

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IOptions<ExplanationServiceOptions> _explanationOptions =
        explanationOptions ?? throw new ArgumentNullException(nameof(explanationOptions));

    /// <inheritdoc />
    public ComparisonExplanationResult BuildComparisonExplanation(
        ComparisonResult comparison,
        ComparisonExplanationSignals signals,
        string? llmJson)
    {
        ArgumentNullException.ThrowIfNull(comparison);
        ArgumentNullException.ThrowIfNull(signals);

        return _deterministic.BuildComparisonExplanation(comparison, signals.MajorChanges, llmJson);
    }

    /// <inheritdoc />
    public ExplanationResult BuildRunExplanation(
        ManifestDocument manifest,
        RunExplanationSignals signals,
        string rawStored)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(signals);

        return _deterministic.BuildRunExplanationFromLlmPayload(
            manifest,
            signals.KeyDrivers,
            signals.Risks,
            signals.Costs,
            signals.Compliance,
            rawStored);
    }

    /// <inheritdoc />
    public ExplanationResult FinalizeRunExplanation(ExplanationResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        result.Confidence = result.Structured?.Confidence;
        result.Provenance = BuildProvenance();

        return result;
    }

    private ExplanationProvenance BuildProvenance()
    {
        ExplanationServiceOptions options = _explanationOptions.Value;
        LlmProviderDescriptor descriptor = _completionClient.Descriptor;
        string agentType = string.IsNullOrWhiteSpace(options.AgentType) ? "run-explanation" : options.AgentType.Trim();
        string modelId = string.IsNullOrWhiteSpace(descriptor.ModelId) ? "unknown" : descriptor.ModelId.Trim();

        return new ExplanationProvenance(
            agentType,
            modelId,
            string.IsNullOrWhiteSpace(options.PromptTemplateId) ? null : options.PromptTemplateId.Trim(),
            string.IsNullOrWhiteSpace(options.PromptTemplateVersion)
                ? null
                : options.PromptTemplateVersion.Trim(),
            string.IsNullOrWhiteSpace(options.PromptContentHash) ? null : options.PromptContentHash.Trim());
    }
}
