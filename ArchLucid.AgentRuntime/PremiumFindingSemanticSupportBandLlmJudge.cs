using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>ADR 0099 Premium LLM semantic support judge used on Real finalize, not on emit.</summary>
public sealed class PremiumFindingSemanticSupportBandLlmJudge(
    IAgentTierCompletionRouter tierCompletionRouter,
    ILogger<PremiumFindingSemanticSupportBandLlmJudge> logger) : IFindingSemanticSupportBandLlmJudge
{
    public const string AgentTypeName = "semantic-support-band-judge";

    private readonly IAgentTierCompletionRouter _tierCompletionRouter =
        tierCompletionRouter ?? throw new ArgumentNullException(nameof(tierCompletionRouter));

    private readonly ILogger<PremiumFindingSemanticSupportBandLlmJudge> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public FindingSemanticSupportBand? TryScore(
        Finding finding,
        string findingMessage,
        IReadOnlyList<string> citationExcerpts,
        FindingSemanticSupportBandOptions options) =>
        null;

    public async Task<FindingSemanticSupportBand?> TryScoreAsync(
        Finding finding,
        string findingMessage,
        IReadOnlyList<string> citationExcerpts,
        FindingSemanticSupportBandOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(citationExcerpts);
        ArgumentNullException.ThrowIfNull(options);

        if (citationExcerpts.Count == 0)
            return null;

        FindingSemanticSupportBand heuristicBand = FindingSemanticSupportBandScorer.Score(
            findingMessage,
            citationExcerpts);

        try
        {
            (IAgentCompletionClient completionClient, _) = _tierCompletionRouter.ResolveForAgentTypeName(
                AgentTypeName,
                taskTierOverride: null);

            string userPrompt = FindingSemanticSupportBandLlmJudgePrompts.BuildUserPrompt(
                findingMessage,
                citationExcerpts);
            string rawJson = await completionClient
                .CompleteJsonAsync(
                    FindingSemanticSupportBandLlmJudgePrompts.SystemPrompt,
                    userPrompt,
                    maxTokens: 80,
                    temperature: 0f,
                    cancellationToken)
                .ConfigureAwait(false);

            FindingSemanticSupportBand? llmBand = FindingSemanticSupportBandLlmJudgmentParser.TryParse(rawJson);

            if (llmBand is null)
            {
                _logger.LogDebug(
                    "Semantic support LLM judge returned unparsable output for finding {FindingId}.",
                    finding.FindingId);

                return null;
            }

            if (!FindingSemanticSupportBandLlmJudgmentFaithfulnessValidator.IsAcceptable(
                    llmBand.Value,
                    heuristicBand))
            {
                _logger.LogWarning(
                    "Semantic support LLM judge failed faithfulness for finding {FindingId}; retaining heuristic {HeuristicBand}.",
                    finding.FindingId,
                    heuristicBand);

                return null;
            }

            return llmBand;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Semantic support LLM judge failed for finding {FindingId}; retaining heuristic band.",
                finding.FindingId);

            return null;
        }
    }
}
