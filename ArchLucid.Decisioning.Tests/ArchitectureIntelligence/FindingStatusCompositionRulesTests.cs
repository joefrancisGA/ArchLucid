using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
public sealed class FindingStatusCompositionRulesTests
{
    [Fact]
    public void Accepted_on_fail_preserves_conclusion_and_requires_actor()
    {
        SpecialistReviewFinding finding = BuildFinding(ReviewConclusion.Fail, GovernanceDisposition.Open);

        bool ok = FindingStatusCompositionRules.TryApplyGovernanceDisposition(
            finding,
            GovernanceDispositionLifecycleEvent.SetAccepted,
            actorUserId: null,
            out SpecialistReviewFinding _,
            out string? reason);

        ok.Should().BeFalse();
        reason.Should().Contain("actor");
    }

    [Fact]
    public void Accepted_on_fail_with_actor_updates_disposition_only()
    {
        SpecialistReviewFinding finding = BuildFinding(ReviewConclusion.Fail, GovernanceDisposition.Open);

        bool ok = FindingStatusCompositionRules.TryApplyGovernanceDisposition(
            finding,
            GovernanceDispositionLifecycleEvent.SetAccepted,
            actorUserId: "reviewer-1",
            out SpecialistReviewFinding updated,
            out string? reason);

        ok.Should().BeTrue();
        reason.Should().BeNull();
        updated.Conclusion.Should().Be(ReviewConclusion.Fail);
        updated.GovernanceDisposition.Should().Be(GovernanceDisposition.Accepted);
    }

    [Fact]
    public void Accepted_on_pass_is_rejected()
    {
        SpecialistReviewFinding finding = BuildFinding(ReviewConclusion.Pass, GovernanceDisposition.Open);

        bool ok = FindingStatusCompositionRules.TryApplyGovernanceDisposition(
            finding,
            GovernanceDispositionLifecycleEvent.SetAccepted,
            actorUserId: "reviewer-1",
            out SpecialistReviewFinding _,
            out string? reason);

        ok.Should().BeFalse();
        reason.Should().Contain("pass");
    }

    [Fact]
    public void Operator_status_for_accepted_fail_does_not_read_as_pass()
    {
        string status = SpecialistReviewFindingStatusFormatter.FormatOperatorStatus(
            ReviewConclusion.Fail,
            GovernanceDisposition.Accepted);

        status.Should().Contain("risk accepted");
        SpecialistReviewFindingStatusFormatter.ReadsAsPass(status).Should().BeFalse();
    }

    private static SpecialistReviewFinding BuildFinding(
        ReviewConclusion conclusion,
        GovernanceDisposition disposition)
    {
        return new SpecialistReviewFinding
        {
            FindingId = "f-1",
            Dimension = QualityDimension.Security,
            Title = "test",
            Rationale = "test",
            Conclusion = conclusion,
            EvidenceCondition = EvidenceCondition.Sufficient,
            GovernanceDisposition = disposition,
            Severity = "High",
        };
    }
}
