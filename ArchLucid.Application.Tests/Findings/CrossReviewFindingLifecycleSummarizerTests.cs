using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingLifecycleSummarizerTests
{
    [Fact]
    public void Summarize_counts_each_state_and_basis()
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records =
        [
            Record(CrossReviewFindingLifecycleState.NewlyIdentified, CrossReviewFindingResolutionBasis.NotApplicable),
            Record(
                CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent,
                CrossReviewFindingResolutionBasis.NotApplicable),
            Record(
                CrossReviewFindingLifecycleState.CandidateResolved,
                CrossReviewFindingResolutionBasis.ConfirmedByDisposition),
            Record(CrossReviewFindingLifecycleState.CandidateResolved, CrossReviewFindingResolutionBasis.Unverified),
            Record(
                CrossReviewFindingLifecycleState.CandidateResolved,
                CrossReviewFindingResolutionBasis.AbsenceNotInformative),
        ];

        CrossReviewFindingLifecycleSummary summary = CrossReviewFindingLifecycleSummarizer.Summarize(records);

        summary.NewlyIdentifiedCount.Should().Be(1);
        summary.PreviouslyIdentifiedStillPresentCount.Should().Be(1);
        summary.ConfirmedResolvedCount.Should().Be(1);
        summary.UnverifiedResolvedCount.Should().Be(1);
        summary.AbsenceNotInformativeCount.Should().Be(1);
        summary.CandidateResolvedCount.Should().Be(3);
    }

    [Fact]
    public void Summarize_states_no_remediation_claim_when_nothing_dropped_out()
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records =
        [
            Record(CrossReviewFindingLifecycleState.NewlyIdentified, CrossReviewFindingResolutionBasis.NotApplicable),
        ];

        CrossReviewFindingLifecycleSummary summary = CrossReviewFindingLifecycleSummarizer.Summarize(records);

        summary.HonestyNote.Should().Contain("no remediation claim");
    }

    [Fact]
    public void Summarize_says_ArchLucid_did_not_retest_confirmed_fixes()
    {
        CrossReviewFindingLifecycleSummary summary = SummarizeSingle(
            CrossReviewFindingResolutionBasis.ConfirmedByDisposition);

        summary.HonestyNote.Should().Contain("did not re-test");
    }

    [Fact]
    public void Summarize_calls_unverified_dropouts_unexplained()
    {
        CrossReviewFindingLifecycleSummary summary = SummarizeSingle(CrossReviewFindingResolutionBasis.Unverified);

        summary.HonestyNote.Should().Contain("unexplained");
    }

    [Fact]
    public void Summarize_denies_evidence_of_a_fix_when_analysis_did_not_run_again()
    {
        CrossReviewFindingLifecycleSummary summary = SummarizeSingle(
            CrossReviewFindingResolutionBasis.AbsenceNotInformative);

        summary.HonestyNote.Should().Contain("not evidence of a fix");
    }

    [Fact]
    public void Summarize_joins_every_applicable_qualifier()
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records =
        [
            Record(
                CrossReviewFindingLifecycleState.CandidateResolved,
                CrossReviewFindingResolutionBasis.ConfirmedByDisposition),
            Record(CrossReviewFindingLifecycleState.CandidateResolved, CrossReviewFindingResolutionBasis.Unverified),
            Record(
                CrossReviewFindingLifecycleState.CandidateResolved,
                CrossReviewFindingResolutionBasis.AbsenceNotInformative),
        ];

        CrossReviewFindingLifecycleSummary summary = CrossReviewFindingLifecycleSummarizer.Summarize(records);

        summary.HonestyNote.Should().Contain("did not re-test")
            .And.Contain("unexplained")
            .And.Contain("not evidence of a fix");
    }

    [Fact]
    public void Summarize_rejects_null_records()
    {
        Action act = () => CrossReviewFindingLifecycleSummarizer.Summarize(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static CrossReviewFindingLifecycleSummary SummarizeSingle(CrossReviewFindingResolutionBasis basis)
    {
        return CrossReviewFindingLifecycleSummarizer.Summarize(
            [Record(CrossReviewFindingLifecycleState.CandidateResolved, basis)]);
    }

    private static CrossReviewFindingLifecycleRecord Record(
        CrossReviewFindingLifecycleState state,
        CrossReviewFindingResolutionBasis basis)
    {
        return new CrossReviewFindingLifecycleRecord
        {
            State = state,
            ResolutionBasis = basis,
            CorrelationMethod = FindingCorrelationMethod.None,
            Severity = FindingSeverity.Warning,
            SourceAgent = AgentType.Compliance,
        };
    }
}
