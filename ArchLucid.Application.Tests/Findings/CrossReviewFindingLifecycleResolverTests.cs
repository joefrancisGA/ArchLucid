using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingLifecycleResolverTests
{
    private static readonly CrossReviewFindingSourceCoverage FullCoverage = new()
    {
        PriorAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
        CurrentAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
    };

    [Fact]
    public void Resolve_marks_matched_findings_still_present()
    {
        ArchitectureFinding prior = Finding("prior-1");
        ArchitectureFinding current = Finding("current-1");
        CrossReviewFindingCorrelationResult correlation = new()
        {
            MatchedPairs =
            [
                new FindingCorrelationPair
                {
                    LeftFindingId = "prior-1",
                    RightFindingId = "current-1",
                    Method = FindingCorrelationMethod.PolicyRuleAndFingerprint,
                },
            ],
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = CrossReviewFindingLifecycleResolver.Resolve(
            [prior],
            [current],
            correlation,
            NoDispositions(),
            FullCoverage);

        records.Should().HaveCount(1);
        records[0].State.Should().Be(CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent);
        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.NotApplicable);
        records[0].PriorFindingId.Should().Be("prior-1");
        records[0].CurrentFindingId.Should().Be("current-1");
        records[0].CorrelationMethod.Should().Be(FindingCorrelationMethod.PolicyRuleAndFingerprint);
    }

    [Fact]
    public void Resolve_marks_unmatched_current_findings_newly_identified()
    {
        ArchitectureFinding current = Finding("current-1");
        CrossReviewFindingCorrelationResult correlation = new()
        {
            UnmatchedRightFindingIds = ["current-1"],
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = CrossReviewFindingLifecycleResolver.Resolve(
            [],
            [current],
            correlation,
            NoDispositions(),
            FullCoverage);

        records.Should().HaveCount(1);
        records[0].State.Should().Be(CrossReviewFindingLifecycleState.NewlyIdentified);
        records[0].PriorFindingId.Should().BeNull();
        records[0].CurrentFindingId.Should().Be("current-1");
    }

    [Fact]
    public void Resolve_confirms_resolution_only_when_a_remediated_disposition_exists()
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = ResolveDroppedOut(
            new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase)
            {
                ["prior-1"] = FindingDisposition.Remediated,
            },
            FullCoverage);

        records.Should().HaveCount(1);
        records[0].State.Should().Be(CrossReviewFindingLifecycleState.CandidateResolved);
        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.ConfirmedByDisposition);
        records[0].LatestDisposition.Should().Be(FindingDisposition.Remediated);
    }

    [Theory]
    [InlineData(FindingDisposition.Accepted)]
    [InlineData(FindingDisposition.Deferred)]
    [InlineData(FindingDisposition.NeedsEvidence)]
    [InlineData(FindingDisposition.RejectedAsNotApplicable)]
    public void Resolve_treats_non_remediated_dispositions_as_unverified(FindingDisposition disposition)
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = ResolveDroppedOut(
            new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase) { ["prior-1"] = disposition },
            FullCoverage);

        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.Unverified);
    }

    [Fact]
    public void Resolve_treats_absent_dispositions_as_unverified()
    {
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = ResolveDroppedOut(NoDispositions(), FullCoverage);

        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.Unverified);
        records[0].LatestDisposition.Should().BeNull();
    }

    [Fact]
    public void Resolve_reports_absence_as_uninformative_when_the_source_agent_did_not_run_again()
    {
        CrossReviewFindingSourceCoverage reducedCoverage = new()
        {
            PriorAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
            CurrentAgentTypes = new HashSet<AgentType> { AgentType.Cost },
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records =
            ResolveDroppedOut(NoDispositions(), reducedCoverage);

        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.AbsenceNotInformative);
    }

    /// <summary>
    ///     Reduced agent coverage must win over a recorded remediation: if the analysis that produced the finding never
    ///     ran again, the comparison has no standing to say the finding is gone.
    /// </summary>
    [Fact]
    public void Resolve_prefers_uninformative_absence_over_a_remediated_disposition()
    {
        CrossReviewFindingSourceCoverage reducedCoverage = new()
        {
            PriorAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
            CurrentAgentTypes = new HashSet<AgentType>(),
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = ResolveDroppedOut(
            new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase)
            {
                ["prior-1"] = FindingDisposition.Remediated,
            },
            reducedCoverage);

        records[0].ResolutionBasis.Should().Be(CrossReviewFindingResolutionBasis.AbsenceNotInformative);
    }

    [Fact]
    public void Resolve_skips_correlation_entries_whose_findings_are_missing()
    {
        CrossReviewFindingCorrelationResult correlation = new()
        {
            MatchedPairs =
            [
                new FindingCorrelationPair { LeftFindingId = "prior-1", RightFindingId = "ghost" },
            ],
            UnmatchedLeftFindingIds = ["ghost-left"],
            UnmatchedRightFindingIds = ["ghost-right"],
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = CrossReviewFindingLifecycleResolver.Resolve(
            [Finding("prior-1")],
            [Finding("current-1")],
            correlation,
            NoDispositions(),
            FullCoverage);

        records.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_orders_by_state_then_descending_severity()
    {
        CrossReviewFindingCorrelationResult correlation = new()
        {
            MatchedPairs =
            [
                new FindingCorrelationPair { LeftFindingId = "prior-1", RightFindingId = "current-2" },
            ],
            UnmatchedRightFindingIds = ["current-1"],
            UnmatchedLeftFindingIds = ["prior-2"],
        };

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = CrossReviewFindingLifecycleResolver.Resolve(
            [Finding("prior-1"), Finding("prior-2")],
            [
                Finding("current-1", FindingSeverity.Info),
                Finding("current-2", FindingSeverity.Critical),
            ],
            correlation,
            NoDispositions(),
            FullCoverage);

        records.Select(record => record.State).Should().ContainInOrder(
            CrossReviewFindingLifecycleState.NewlyIdentified,
            CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent,
            CrossReviewFindingLifecycleState.CandidateResolved);
    }

    [Fact]
    public void Resolve_rejects_null_arguments()
    {
        CrossReviewFindingCorrelationResult correlation = new();

        Action act = () => CrossReviewFindingLifecycleResolver.Resolve(
            null!,
            [],
            correlation,
            NoDispositions(),
            FullCoverage);

        act.Should().Throw<ArgumentNullException>();
    }

    private static IReadOnlyList<CrossReviewFindingLifecycleRecord> ResolveDroppedOut(
        IReadOnlyDictionary<string, FindingDisposition> dispositions,
        CrossReviewFindingSourceCoverage coverage)
    {
        CrossReviewFindingCorrelationResult correlation = new()
        {
            UnmatchedLeftFindingIds = ["prior-1"],
        };

        return CrossReviewFindingLifecycleResolver.Resolve(
            [Finding("prior-1")],
            [],
            correlation,
            dispositions,
            coverage);
    }

    private static IReadOnlyDictionary<string, FindingDisposition> NoDispositions()
    {
        return new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase);
    }

    private static ArchitectureFinding Finding(string findingId, FindingSeverity severity = FindingSeverity.Warning)
    {
        return new ArchitectureFinding
        {
            FindingId = findingId,
            SourceAgent = AgentType.Compliance,
            Severity = severity,
            Category = "Network",
            Message = $"Message for {findingId}",
        };
    }
}
