using ArchLucid.Contracts.Findings;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Deterministic TB-382 insight-density gate — no LLM calls; populates score/treatment/classification only.
/// </summary>
public sealed class DeterministicInsightDensityGate(IOptions<InsightDensityGateOptions> options) : IInsightDensityGate
{
    private readonly InsightDensityGateOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    /// <summary>Default gate for obsolete constructors and unit tests.</summary>
    public static IInsightDensityGate CreateDefault()
    {
        return new DeterministicInsightDensityGate(Microsoft.Extensions.Options.Options.Create(new InsightDensityGateOptions()));
    }

    public InsightDensityGateResult Score(
        InsightDensityGateCandidate candidate,
        IReadOnlyList<InsightDensityGateCandidate> snapshotPeers)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(snapshotPeers);

        List<string> penaltyReasons = [];
        int score = 100;

        bool hasConcreteEvidence = GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(candidate.EvidenceRefs);
        bool hasArchitectureAnchor = GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(
            candidate.Message,
            candidate.EvidenceRefs);
        bool isGenericAdvice = GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(candidate.Message);

        if (isGenericAdvice)
        {
            score -= 35;
            penaltyReasons.Add("generic-advice");
        }

        if (!hasConcreteEvidence)
        {
            score -= 25;
            penaltyReasons.Add("no-concrete-evidence");
        }

        if (!hasArchitectureAnchor)
        {
            score -= 15;
            penaltyReasons.Add("no-architecture-anchor");
        }

        if (GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(candidate.Message) && hasConcreteEvidence)
        {
            score += 10;
            penaltyReasons.Add("falsifiability-signal");
        }

        if (candidate.Severity >= FindingSeverity.Error)
        {
            score += 5;
            penaltyReasons.Add("severity-calibration");
        }

        (double duplicationSimilarity, InsightDensityGateCandidate? duplicationPeer) =
            InsightDensityTextSimilarityWithPeer.MaxPeerSimilarityWithPeer(
                candidate.Message,
                snapshotPeers,
                candidate.CandidateKey);

        bool applyDuplicationPenalty = ShouldApplyDuplicationPenalty(candidate, duplicationPeer);

        if (applyDuplicationPenalty && duplicationSimilarity >= _options.HighDuplicationSimilarityThreshold)
        {
            score -= 30;
            penaltyReasons.Add("high-duplication");
        }
        else if (applyDuplicationPenalty && duplicationSimilarity >= _options.ModerateDuplicationSimilarityThreshold)
        {
            score -= 15;
            penaltyReasons.Add("moderate-duplication");
        }

        if (HasCrossEngineCorroboration(candidate, snapshotPeers))
        {
            score = Math.Min(100, score + 10);
            penaltyReasons.Add("cross-engine-corroboration");
        }

        if (hasConcreteEvidence && candidate.ImpactHopCount is int hopCount)
        {
            if (hopCount >= 4)
            {
                score = Math.Min(100, score + 10);
                penaltyReasons.Add("impact-witness");
            }
            else if (hopCount >= 2)
            {
                score = Math.Min(100, score + 5);
                penaltyReasons.Add("impact-witness");
            }
        }

        score = Math.Clamp(score, 0, 100);

        if (!candidate.IsAgentArchitectureFinding)
        {
            penaltyReasons.Add("typed-engine-scored");
        }

        bool hasFalsifiabilitySignal = GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(candidate.Message);
        bool demote = InsightDensityDemotionPredicate.ShouldDemote(
            score,
            _options.DemotionThreshold,
            isGenericAdvice,
            hasFalsifiabilitySignal,
            hasConcreteEvidence);

        return new InsightDensityGateResult
        {
            InsightDensityScore = score,
            Treatment = demote ? FindingTreatment.DemoteToChecklist : FindingTreatment.Promote,
            Classification = demote
                ? FindingClassification.ChecklistCoverage
                : FindingClassification.DecisionGradeFinding,
            PenaltyReasons = penaltyReasons,
        };
    }

    private static bool ShouldApplyDuplicationPenalty(
        InsightDensityGateCandidate candidate,
        InsightDensityGateCandidate? duplicationPeer)
    {
        if (duplicationPeer is null)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(duplicationPeer.EngineType))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(candidate.EngineType))
        {
            return true;
        }

        return candidate.EngineType.Equals(duplicationPeer.EngineType, StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasCrossEngineCorroboration(
        InsightDensityGateCandidate candidate,
        IReadOnlyList<InsightDensityGateCandidate> snapshotPeers)
    {
        if (!InsightDensityPreferredEngineTypes.IsPreferred(candidate.EngineType))
        {
            return false;
        }

        if (candidate.RelatedNodeIds.Count == 0)
        {
            return false;
        }

        foreach (InsightDensityGateCandidate peer in snapshotPeers)
        {
            if (string.Equals(peer.CandidateKey, candidate.CandidateKey, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(peer.EngineType))
            {
                continue;
            }

            if (peer.EngineType.Equals(candidate.EngineType, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (peer.RelatedNodeIds.Count == 0)
            {
                continue;
            }

            if (candidate.RelatedNodeIds.Any(nodeId =>
                    peer.RelatedNodeIds.Any(peerNodeId =>
                        peerNodeId.Equals(nodeId, StringComparison.OrdinalIgnoreCase))))
            {
                return true;
            }
        }

        return false;
    }
}
