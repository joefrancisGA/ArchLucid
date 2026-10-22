using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewLatestDispositionMapTests
{
    private static readonly DateTimeOffset BaseUtc = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Build_keeps_the_most_recent_disposition_per_finding()
    {
        IReadOnlyList<FindingReviewEventRecord> events =
        [
            Event("finding-1", FindingDisposition.Deferred, BaseUtc),
            Event("finding-1", FindingDisposition.Remediated, BaseUtc.AddDays(1)),
        ];

        IReadOnlyDictionary<string, FindingDisposition> map = CrossReviewLatestDispositionMap.Build(events);

        map["finding-1"].Should().Be(FindingDisposition.Remediated);
    }

    /// <summary>Input order must not decide the winner — the map orders by occurrence time itself.</summary>
    [Fact]
    public void Build_ignores_input_ordering()
    {
        IReadOnlyList<FindingReviewEventRecord> events =
        [
            Event("finding-1", FindingDisposition.Remediated, BaseUtc.AddDays(1)),
            Event("finding-1", FindingDisposition.Deferred, BaseUtc),
        ];

        IReadOnlyDictionary<string, FindingDisposition> map = CrossReviewLatestDispositionMap.Build(events);

        map["finding-1"].Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void Build_skips_events_without_a_disposition()
    {
        IReadOnlyList<FindingReviewEventRecord> events = [Event("finding-1", disposition: null, BaseUtc)];

        IReadOnlyDictionary<string, FindingDisposition> map = CrossReviewLatestDispositionMap.Build(events);

        map.Should().BeEmpty();
    }

    [Fact]
    public void Build_skips_events_without_a_finding_id()
    {
        IReadOnlyList<FindingReviewEventRecord> events = [Event("   ", FindingDisposition.Remediated, BaseUtc)];

        IReadOnlyDictionary<string, FindingDisposition> map = CrossReviewLatestDispositionMap.Build(events);

        map.Should().BeEmpty();
    }

    [Fact]
    public void Build_matches_finding_ids_case_insensitively()
    {
        IReadOnlyList<FindingReviewEventRecord> events = [Event("Finding-1", FindingDisposition.Remediated, BaseUtc)];

        IReadOnlyDictionary<string, FindingDisposition> map = CrossReviewLatestDispositionMap.Build(events);

        map.ContainsKey("finding-1").Should().BeTrue();
    }

    [Fact]
    public void Build_rejects_null_events()
    {
        Action act = () => CrossReviewLatestDispositionMap.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static FindingReviewEventRecord Event(
        string findingId,
        FindingDisposition? disposition,
        DateTimeOffset occurredAtUtc)
    {
        return new FindingReviewEventRecord
        {
            EventId = Guid.NewGuid(),
            FindingId = findingId,
            Disposition = disposition,
            Action = FindingReviewAction.RecordDisposition,
            OccurredAtUtc = occurredAtUtc,
        };
    }
}
