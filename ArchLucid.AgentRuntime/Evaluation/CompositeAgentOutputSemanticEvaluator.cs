using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentOutputSemanticEvaluator" />
public sealed class CompositeAgentOutputSemanticEvaluator(
    IHeuristicAgentOutputSemanticEvaluator heuristic,
    IAgentOutputLlmSemanticJudge judge,
    IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> judgeOptions,
    IOptionsMonitor<AgentOutputQualityGateOptions> gateOptions) : IAgentOutputSemanticEvaluator
{
    private readonly IHeuristicAgentOutputSemanticEvaluator _heuristic =
        heuristic ?? throw new ArgumentNullException(nameof(heuristic));

    private readonly IAgentOutputLlmSemanticJudge _judge = judge ?? throw new ArgumentNullException(nameof(judge));

    private readonly IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> _judgeOptions =
        judgeOptions ?? throw new ArgumentNullException(nameof(judgeOptions));

    private readonly IOptionsMonitor<AgentOutputQualityGateOptions> _gateOptions =
        gateOptions ?? throw new ArgumentNullException(nameof(gateOptions));

    /// <inheritdoc />
    public async Task<AgentOutputSemanticScore> EvaluateAsync(
        string traceId,
        string? parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        AgentOutputSemanticScore heuristicScore = _heuristic.Evaluate(traceId, parsedResultJson, agentType);

        double ho = heuristicScore.HeuristicOverallScore;

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return heuristicScore;

        AgentOutputLlmJudgeParsedResult? judged =
            await _judge.TryJudgeAsync(traceId, parsedResultJson, agentType, cancellationToken)
                .ConfigureAwait(false);

        if (judged is null)
        {
            heuristicScore.OverallSemanticScore = ho;

            return heuristicScore;
        }

        AgentOutputLlmSemanticJudgeOptions judgeOpts = _judgeOptions.CurrentValue;
        AgentOutputQualityGateOptions gateOpts = _gateOptions.CurrentValue;

        double blendWeight = Math.Clamp(judgeOpts.BlendWeight, 0.0, 1.0);
        double blended = blendWeight * judged.OverallQuality + (1.0 - blendWeight) * ho;

        heuristicScore.LlmJudgeOverallQuality = judged.OverallQuality;
        heuristicScore.LlmJudgeNotes = judged.Rationale;
        heuristicScore.LlmJudgeQualityDispersion =
            judged.InvocationCount > 1 ? judged.QualitySampleDispersion : null;
        heuristicScore.LlmJudgeInvocationCount = judged.InvocationCount;

        double disagreement = Math.Abs(judged.OverallQuality - ho);

        heuristicScore.LlmJudgeHeuristicDisagreement = disagreement;

        heuristicScore.OverallSemanticScore = blended;

        double disagreementWarnFloor = Math.Clamp(judgeOpts.WarnGateWhenJudgeHeuristicDisagreementAbove, 0.0, 1.0);

        double semanticWarn =
            gateOpts.PerAgentTypeFloors.TryGetValue(agentType.ToString(), out AgentTypeQualityFloors? floors)
            && floors.SemanticWarnBelow.HasValue == true
                ? floors.SemanticWarnBelow!.Value
                : gateOpts.SemanticWarnBelow;

        bool judgeLow = judged.OverallQuality + 1e-9 < semanticWarn;
        bool heuristicLow = ho + 1e-9 < semanticWarn;

        if (disagreement > disagreementWarnFloor + 1e-12 && (judgeLow || heuristicLow))
            heuristicScore.JudgeHeuristicDisagreementElevatesWarn = true;

        return heuristicScore;
    }
}
