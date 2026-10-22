using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceFinalizeTrustEvaluator
{
    PreFinalizeChecklistItem EvaluateMustNotFail(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations);

    PreFinalizeChecklistItem EvaluateTrustPublish(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations);
}

public sealed class ArchitectureIntelligenceFinalizeTrustEvaluator(
    IMustNotFailEnforcer mustNotFailEnforcer,
    ITrustPublishGate trustPublishGate) : IArchitectureIntelligenceFinalizeTrustEvaluator
{
    private readonly IMustNotFailEnforcer _mustNotFailEnforcer =
        mustNotFailEnforcer ?? throw new ArgumentNullException(nameof(mustNotFailEnforcer));

    private readonly ITrustPublishGate _trustPublishGate =
        trustPublishGate ?? throw new ArgumentNullException(nameof(trustPublishGate));

    public PreFinalizeChecklistItem EvaluateMustNotFail(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations)
    {
        IReadOnlyList<MustNotFailViolation> violations = _mustNotFailEnforcer.Evaluate(findings, recommendations);
        int blockingCount = violations.Count(violation => violation.Blocked);

        if (blockingCount == 0)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "architecture-intelligence-must-not-fail",
                Title = "Closed-loop integrity (must-not-fail)",
                Detail = "No must-not-fail integrity violations detected on specialist output.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        return new PreFinalizeChecklistItem
        {
            ItemId = "architecture-intelligence-must-not-fail",
            Title = "Closed-loop integrity (must-not-fail)",
            Detail =
                $"{blockingCount} must-not-fail violation{(blockingCount == 1 ? "" : "s")} would block closed-loop publish — advisory unless an enforcing pack applies.",
            Status = PreFinalizeChecklistItemStatus.Advisory,
            Count = blockingCount,
        };
    }

    public PreFinalizeChecklistItem EvaluateTrustPublish(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations)
    {
        IReadOnlyList<MustNotFailViolation> violations = _mustNotFailEnforcer.Evaluate(findings, recommendations);
        TrustPublishDecision decision = _trustPublishGate.Decide(
            findings,
            recommendations,
            [],
            violations);

        if (!decision.PublishBlocked)
        {
            return new PreFinalizeChecklistItem
            {
                ItemId = "architecture-intelligence-trust-publish",
                Title = "Closed-loop trust-publish gate",
                Detail = "Specialist output would pass the trust-publish gate.",
                Status = PreFinalizeChecklistItemStatus.Clear,
                Count = 0,
            };
        }

        return new PreFinalizeChecklistItem
        {
            ItemId = "architecture-intelligence-trust-publish",
            Title = "Closed-loop trust-publish gate",
            Detail =
                "Trust-publish gate would block publishing this specialist output — advisory unless enforcing thresholds apply.",
            Status = PreFinalizeChecklistItemStatus.Advisory,
            Count = decision.BlockReasons.Count,
        };
    }
}
