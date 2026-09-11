using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>TB-2321: server classifiers must mirror <c>finding-quality-signals.ts</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FinalizeQualityFindingSignalsTests
{
    [Theory]
    [InlineData("cannot determine")]
    [InlineData("Cannot Verify")]
    [InlineData("insufficient evidence")]
    [InlineData("unable to verify")]
    [InlineData("cannot validate")]
    [InlineData("cannot confirm")]
    public void IsCannotDetermine_matches_every_ui_phrase_case_insensitively(string phrase)
    {
        Finding finding = NewFinding(title: $"Encryption at rest: {phrase} from provided diagrams");

        FinalizeQualityFindingSignals.IsCannotDetermine(finding).Should().BeTrue();
    }

    [Fact]
    public void IsCannotDetermine_matches_phrase_in_recommended_actions_and_rationale()
    {
        Finding fromActions = NewFinding(title: "Backup posture");
        fromActions.RecommendedActions.Add("Reviewer cannot confirm restore drills ran.");
        Finding fromRationale = NewFinding(title: "Backup posture", rationale: "Insufficient evidence for RPO.");

        FinalizeQualityFindingSignals.IsCannotDetermine(fromActions).Should().BeTrue();
        FinalizeQualityFindingSignals.IsCannotDetermine(fromRationale).Should().BeTrue();
    }

    [Fact]
    public void IsCannotDetermine_treats_missing_fact_on_ungrounded_high_severity_as_open_question()
    {
        Finding finding = NewFinding(title: "Key rotation policy not documented", severity: FindingSeverity.Error);

        FinalizeQualityFindingSignals.IsCannotDetermine(finding).Should().BeTrue();
    }

    [Fact]
    public void IsCannotDetermine_ignores_missing_fact_when_grounded_or_below_error()
    {
        Finding grounded = NewFinding(title: "Key rotation policy not documented", severity: FindingSeverity.Error);
        grounded.EvidenceRefs.Add("doc-1#p3");
        Finding ruleBacked = NewFinding(title: "Key rotation policy not documented", severity: FindingSeverity.Error);
        ruleBacked.PolicyRuleId = "sec-rotation";
        Finding warning = NewFinding(title: "Key rotation policy not documented", severity: FindingSeverity.Warning);

        FinalizeQualityFindingSignals.IsCannotDetermine(grounded).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCannotDetermine(ruleBacked).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCannotDetermine(warning).Should().BeFalse();
    }

    [Fact]
    public void IsCannotDetermine_excludes_muted_and_adversarial_lane_findings()
    {
        Finding muted = NewFinding(title: "cannot determine ingress exposure");
        muted.IsMuted = true;
        Finding adversarial = NewFinding(title: "cannot determine ingress exposure");
        adversarial.Properties["architectureIntelligence.adversarialLane"] = "AdversarialChallenge";
        Finding hypothesis = NewFinding(title: "cannot determine ingress exposure");
        hypothesis.Properties["architectureIntelligence.provenancePresentation"] = "Hypothesis";

        FinalizeQualityFindingSignals.IsCannotDetermine(muted).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCannotDetermine(adversarial).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCannotDetermine(hypothesis).Should().BeFalse();
    }

    [Theory]
    [InlineData("requirement-coverage-gap", "Anything")]
    [InlineData("REQUIREMENT_COVERAGE", "Anything")]
    [InlineData(null, "Uncovered requirement: REQ-7 has no owner")]
    [InlineData(null, "REQ-7 has no design decision recorded")]
    [InlineData(null, "Requirement lacks a traceable component")]
    [InlineData(null, "Failure mode for queue backlog is not documented")]
    [InlineData(null, "Data classification unknown for customer table")]
    [InlineData(null, "Data class missing on PII store")]
    public void IsCoverageGap_matches_rule_and_phrase_variants(string? rule, string title)
    {
        Finding finding = NewFinding(title: title);
        finding.PolicyRuleId = rule;

        FinalizeQualityFindingSignals.IsCoverageGap(finding).Should().BeTrue();
    }

    [Fact]
    public void IsCoverageGap_requires_gap_phrase_alongside_failure_mode_or_data_class()
    {
        Finding failureModeOnly = NewFinding(title: "Failure mode analysis complete for queue backlog");
        Finding dataClassOnly = NewFinding(title: "Data classification confirmed as Internal");

        FinalizeQualityFindingSignals.IsCoverageGap(failureModeOnly).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCoverageGap(dataClassOnly).Should().BeFalse();
    }

    [Theory]
    [InlineData("contradict-rule", "Anything")]
    [InlineData(null, "Diagram contradicts narrative on VNet peering")]
    [InlineData(null, "This conflicts with the stated RTO")]
    [InlineData(null, "Opposite conclusion reached on shared evidence")]
    [InlineData(null, "Diagram vs narrative mismatch")]
    public void IsContradiction_matches_rule_and_phrase_variants(string? rule, string title)
    {
        Finding finding = NewFinding(title: title);
        finding.PolicyRuleId = rule;

        FinalizeQualityFindingSignals.IsContradiction(finding).Should().BeTrue();
    }

    [Fact]
    public void IsMergeConflict_matches_rule_id_or_property_flag()
    {
        Finding byRule = NewFinding(title: "Merged");
        byRule.PolicyRuleId = "finding-merge-conflict";
        Finding byProperty = NewFinding(title: "Merged");
        byProperty.Properties["findingMerge.conflict"] = "True";
        Finding neither = NewFinding(title: "Merged");

        FinalizeQualityFindingSignals.IsMergeConflict(byRule).Should().BeTrue();
        FinalizeQualityFindingSignals.IsMergeConflict(byProperty).Should().BeTrue();
        FinalizeQualityFindingSignals.IsMergeConflict(neither).Should().BeFalse();
    }

    [Fact]
    public void IsVerifyHypothesis_matches_lane_ungrounded_or_phrases()
    {
        Finding lane = NewFinding(title: "Exposure");
        lane.Properties["architectureIntelligence.adversarialLane"] = "AdversarialChallenge";
        Finding ungrounded = NewFinding(title: "Exposure");
        Finding phrase = NewFinding(title: "Exposure: falsify/confirm with a load test");
        phrase.EvidenceRefs.Add("doc-1");
        Finding grounded = NewFinding(title: "Exposure");
        grounded.EvidenceRefs.Add("doc-1");

        FinalizeQualityFindingSignals.IsVerifyHypothesis(lane).Should().BeTrue();
        FinalizeQualityFindingSignals.IsVerifyHypothesis(ungrounded).Should().BeTrue();
        FinalizeQualityFindingSignals.IsVerifyHypothesis(phrase).Should().BeTrue();
        FinalizeQualityFindingSignals.IsVerifyHypothesis(grounded).Should().BeFalse();
    }

    [Fact]
    public void IsFinalizeResolved_accepts_human_review_or_closing_disposition()
    {
        Finding approved = NewFinding(title: "x");
        approved.HumanReviewStatus = FindingHumanReviewStatus.Approved;
        Finding overridden = NewFinding(title: "x");
        overridden.HumanReviewStatus = FindingHumanReviewStatus.Overridden;
        Finding pending = NewFinding(title: "x");
        pending.HumanReviewStatus = FindingHumanReviewStatus.Pending;

        FinalizeQualityFindingSignals.IsFinalizeResolved(approved, null).Should().BeTrue();
        FinalizeQualityFindingSignals.IsFinalizeResolved(overridden, null).Should().BeTrue();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, FindingDisposition.Accepted).Should().BeTrue();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, FindingDisposition.Remediated).Should().BeTrue();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, FindingDisposition.RejectedAsNotApplicable).Should().BeTrue();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, FindingDisposition.Deferred).Should().BeFalse();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, FindingDisposition.NeedsEvidence).Should().BeFalse();
        FinalizeQualityFindingSignals.IsFinalizeResolved(pending, null).Should().BeFalse();
    }

    [Fact]
    public void IsOpenCannotDetermineJobView_yields_to_higher_priority_buckets()
    {
        Finding open = NewFinding(title: "cannot determine ingress exposure");
        Finding deferred = NewFinding(title: "cannot determine ingress exposure");
        Finding closed = NewFinding(title: "cannot determine ingress exposure");
        Finding contradiction = NewFinding(title: "cannot determine; diagram contradicts narrative");
        Finding merge = NewFinding(title: "cannot determine ingress exposure");
        merge.PolicyRuleId = "finding-merge-conflict";

        FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(open, null).Should().BeTrue();
        FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(deferred, FindingDisposition.Deferred).Should().BeFalse();
        FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(closed, FindingDisposition.Accepted).Should().BeFalse();
        FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(contradiction, null).Should().BeFalse();
        FinalizeQualityFindingSignals.IsOpenCannotDetermineJobView(merge, null).Should().BeFalse();
    }

    [Fact]
    public void IsCoverageGapJobView_yields_to_cannot_determine_and_hypothesis_buckets()
    {
        // Grounded so the ungrounded → verify-hypothesis bucket does not swallow the coverage-gap classification.
        Finding gap = NewFinding(title: "Uncovered requirement REQ-3");
        gap.EvidenceRefs.Add("doc-1");
        Finding ungroundedGap = NewFinding(title: "Uncovered requirement REQ-3");
        Finding question = NewFinding(title: "Uncovered requirement REQ-3 — cannot determine owner");
        question.EvidenceRefs.Add("doc-1");
        Finding closed = NewFinding(title: "Uncovered requirement REQ-3");
        closed.EvidenceRefs.Add("doc-1");
        closed.HumanReviewStatus = FindingHumanReviewStatus.Approved;

        FinalizeQualityFindingSignals.IsCoverageGapJobView(gap, null).Should().BeTrue();
        FinalizeQualityFindingSignals.IsCoverageGapJobView(ungroundedGap, null).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCoverageGapJobView(question, null).Should().BeFalse();
        FinalizeQualityFindingSignals.IsCoverageGapJobView(closed, null).Should().BeFalse();
    }

    [Fact]
    public void Classifiers_reject_null_finding()
    {
        Action cannotDetermine = () => FinalizeQualityFindingSignals.IsCannotDetermine(null!);
        Action coverageGap = () => FinalizeQualityFindingSignals.IsCoverageGap(null!);
        Action resolved = () => FinalizeQualityFindingSignals.IsFinalizeResolved(null!, null);

        cannotDetermine.Should().Throw<ArgumentNullException>();
        coverageGap.Should().Throw<ArgumentNullException>();
        resolved.Should().Throw<ArgumentNullException>();
    }

    private static Finding NewFinding(
        string title,
        string rationale = "",
        FindingSeverity severity = FindingSeverity.Warning)
    {
        return new Finding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Title = title,
            Rationale = rationale,
            Severity = severity,
            FindingType = "test",
            Category = "test",
            EngineType = "test",
        };
    }
}
