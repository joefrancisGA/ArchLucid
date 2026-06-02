using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Uses the economy (fast deployment) tier to compress evidence before context overflow.</summary>
public sealed class EvidenceSummarizationService(
    IAgentTierCompletionRouter tierCompletionRouter,
    IOptionsMonitor<EvidenceSummarizationOptions> options,
    ILogger<EvidenceSummarizationService> logger) : IEvidenceSummarizationService
{
    private const string SystemPrompt =
        "You are a lossless evidence compressor for architecture analysis. Preserve all named services, "
        + "cost figures, policy rule IDs, finding IDs, and constraint labels. Remove duplicate sentences "
        + "and boilerplate. Output dense plain text.";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly IOptionsMonitor<EvidenceSummarizationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<EvidenceSummarizationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> SummarizeAsync(
        string evidenceText,
        int targetMaxTokens,
        AgentType agentType,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(evidenceText))
            return string.Empty;

        EvidenceSummarizationOptions opts = _options.CurrentValue;

        if (!opts.Enabled)
            return evidenceText;

        int cappedTargetTokens = Math.Max(1, targetMaxTokens);
        string cappedEvidence = CapEvidenceText(evidenceText, opts.MaxInputCharacters);

        (IAgentCompletionClient completionClient, _) =
            _tierCompletionRouter.ResolveForAgent(agentType, LlmModelTier.Economy);

        try
        {
            string summary = await completionClient
                .CompleteJsonAsync(
                    SystemPrompt,
                    cappedEvidence,
                    maxTokens: cappedTargetTokens,
                    temperature: 0.1f,
                    cancellationToken)
                .ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(summary))
                return evidenceText;

            return summary.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Evidence summarization failed for agent {AgentType}; returning original evidence text.",
                agentType);

            return evidenceText;
        }
    }

    private static string CapEvidenceText(string evidenceText, int maxInputCharacters)
    {
        int cap = Math.Max(1, maxInputCharacters);

        if (evidenceText.Length <= cap)
            return evidenceText;

        return evidenceText[..cap];
    }
}
