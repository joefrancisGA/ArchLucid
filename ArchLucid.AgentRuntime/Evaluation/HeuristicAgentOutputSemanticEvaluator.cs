using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Deterministic JSON inspection scoring claim evidence and finding completeness (no LLM).
/// </summary>
/// <inheritdoc cref="IHeuristicAgentOutputSemanticEvaluator" />
public sealed class HeuristicAgentOutputSemanticEvaluator : IHeuristicAgentOutputSemanticEvaluator
{
    private const int MinDescriptionLengthLegacy = 10;
    private const int MinRecommendationLengthLegacy = 5;

    private readonly AgentOutputQualityGateOptions _gateOptions;

    /// <summary>Tests / harnesses without DI wiring.</summary>
    public HeuristicAgentOutputSemanticEvaluator()
        : this(Options.Create(new AgentOutputQualityGateOptions()))
    {
    }

    public HeuristicAgentOutputSemanticEvaluator(IOptions<AgentOutputQualityGateOptions> gateOptions)
    {
        ArgumentNullException.ThrowIfNull(gateOptions);
        _gateOptions = gateOptions.Value;
    }

    private bool Tightened => _gateOptions.HeuristicEvaluatorTightenedThresholds;

    private int MinDescriptionLength => Tightened ? 60 : MinDescriptionLengthLegacy;

    private int MinRecommendationLength => Tightened ? 25 : MinRecommendationLengthLegacy;

    /// <inheritdoc />
    public AgentOutputSemanticScore Evaluate(string traceId, string? parsedResultJson, AgentType agentType)
    {
        ArgumentException.ThrowIfNullOrEmpty(traceId);

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return BuildZeroScore(traceId, agentType);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return BuildZeroScore(traceId, agentType);

            HeuristicAgentOutputClaimEvidenceStage claimStage = new(Tightened);
            HeuristicAgentOutputTraceQualityStage traceQualityStage = new(
                Tightened,
                MinDescriptionLength,
                MinRecommendationLength);

            (double claimsRatio, int emptyClaims) = claimStage.Evaluate(doc.RootElement);
            (double findingsRatio, int incompleteFindings) = traceQualityStage.EvaluateFindings(doc.RootElement);

            double proposedSurfaceRatio = traceQualityStage.EvaluateProposedChangesSurfaceRatio(doc.RootElement);
            double overall = ComputeOverallScore(claimsRatio, findingsRatio, proposedSurfaceRatio, agentType, doc.RootElement);

            return new AgentOutputSemanticScore
            {
                TraceId = traceId,
                AgentType = agentType,
                ClaimsQualityRatio = claimsRatio,
                FindingsQualityRatio = findingsRatio,
                EmptyClaimCount = emptyClaims,
                IncompleteFindingCount = incompleteFindings,
                OverallSemanticScore = overall,
                HeuristicOverallScore = overall
            };
        }
        catch (JsonException)
        {
            return BuildZeroScore(traceId, agentType);
        }
    }

    private static double ComputeOverallScore(
        double claimsRatio,
        double findingsRatio,
        double proposedSurfaceRatio,
        AgentType agentType,
        JsonElement root)
    {
        bool hasClaims = root.TryGetProperty("claims", out JsonElement c)
                         && c.ValueKind == JsonValueKind.Array
                         && c.GetArrayLength() > 0;

        bool hasFindings = root.TryGetProperty("findings", out JsonElement f)
                           && f.ValueKind == JsonValueKind.Array
                           && f.GetArrayLength() > 0;

        // Adversarial Critic must surface disagreements as findings; empty findings[] is non-performative (TB-177).
        if (agentType == AgentType.Critic && !hasFindings)
            return 0.0;

        bool topologyProposedOnly =
            agentType == AgentType.Topology && !hasClaims && !hasFindings && proposedSurfaceRatio > 0;

        if (!hasClaims && !hasFindings && !topologyProposedOnly)
            return 0.0;

        if (topologyProposedOnly)
            return proposedSurfaceRatio;

        if (hasClaims && !hasFindings)
            return claimsRatio;

        if (!hasClaims && hasFindings)
            return findingsRatio;

        (double claimsWeight, double findingsWeight) = SemanticWeights(agentType);

        return claimsRatio * claimsWeight + findingsRatio * findingsWeight;
    }

    private static (double ClaimsWeight, double FindingsWeight) SemanticWeights(AgentType agentType)
    {
        return agentType switch
        {
            AgentType.Compliance => (0.7, 0.3),
            AgentType.Topology => (0.4, 0.6),
            AgentType.Critic => (0.25, 0.75),
            AgentType.Cost => (0.55, 0.45),
            _ => throw new ArgumentOutOfRangeException(nameof(agentType), agentType, null)
        };
    }

    private static AgentOutputSemanticScore BuildZeroScore(string traceId, AgentType agentType)
    {
        return new AgentOutputSemanticScore
        {
            TraceId = traceId,
            AgentType = agentType,
            ClaimsQualityRatio = 0.0,
            FindingsQualityRatio = 0.0,
            EmptyClaimCount = 0,
            IncompleteFindingCount = 0,
            OverallSemanticScore = 0.0,
            HeuristicOverallScore = 0.0
        };
    }
}
