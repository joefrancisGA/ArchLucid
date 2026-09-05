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

        if (GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(candidate.Message))
        {
            score += 10;
            penaltyReasons.Add("falsifiability-signal");
        }

        if (candidate.Severity >= FindingSeverity.Error)
        {
            score += 5;
            penaltyReasons.Add("severity-calibration");
        }

        double duplicationSimilarity = InsightDensityTextSimilarity.MaxPeerSimilarity(
            candidate.Message,
            snapshotPeers,
            candidate.CandidateKey);

        if (duplicationSimilarity >= _options.HighDuplicationSimilarityThreshold)
        {
            score -= 30;
            penaltyReasons.Add("high-duplication");
        }
        else if (duplicationSimilarity >= _options.ModerateDuplicationSimilarityThreshold)
        {
            score -= 15;
            penaltyReasons.Add("moderate-duplication");
        }

        score = Math.Clamp(score, 0, 100);

        if (!candidate.IsAgentArchitectureFinding)
        {
            penaltyReasons.Add("typed-engine-scored");
        }

        bool demote = score < _options.DemotionThreshold && !hasArchitectureAnchor && !hasConcreteEvidence;

        if (demote && !InsightDensityAgentCategoryRules.IsDemotionEligibleCategory(candidate.Category))
        {
            demote = false;
            penaltyReasons.Add("category-protected");
        }

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
}
