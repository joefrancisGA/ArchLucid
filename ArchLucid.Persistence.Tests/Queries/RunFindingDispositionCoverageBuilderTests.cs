using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingDispositionCoverageBuilderTests
{
    [Fact]
    public void Build_returns_null_when_snapshot_missing_or_empty()
    {
        RunFindingDispositionCoverageBuilder.Build(null, [], []).Should().BeNull();

        FindingsSnapshot empty = new() { Findings = [] };

        RunFindingDispositionCoverageBuilder.Build(empty, [], []).Should().BeNull();
    }

    [Fact]
    public void Build_returns_null_when_finding_ids_are_blank()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding { FindingId = "  ", FindingType = "t", Category = "c" },
            ],
        };

        RunFindingDispositionCoverageBuilder.Build(snapshot, [], []).Should().BeNull();
    }

    [Fact]
    public void Build_counts_open_waived_and_each_disposition_branch()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding { FindingId = "open-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "accepted-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "deferred-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "needs-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "remediated-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "rejected-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "waived-1", FindingType = "t", Category = "c" },
                new Finding { FindingId = "unknown-1", FindingType = "t", Category = "c" },
            ],
        };

        DateTimeOffset t0 = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        List<FindingReviewEventRecord> events =
        [
            Review("accepted-1", FindingDisposition.Accepted, t0),
            Review("deferred-1", FindingDisposition.Deferred, t0.AddMinutes(1)),
            Review("needs-1", FindingDisposition.NeedsEvidence, t0.AddMinutes(2)),
            Review("remediated-1", FindingDisposition.Remediated, t0.AddMinutes(3)),
            Review("rejected-1", FindingDisposition.RejectedAsNotApplicable, t0.AddMinutes(4)),
            Review("unknown-1", (FindingDisposition)99, t0.AddMinutes(5)),
            new FindingReviewEventRecord
            {
                EventId = Guid.NewGuid(),
                FindingId = "accepted-1",
                Action = FindingReviewAction.RecordDisposition,
                Disposition = FindingDisposition.Deferred,
                OccurredAtUtc = t0.AddMinutes(10),
            },
            new FindingReviewEventRecord
            {
                EventId = Guid.NewGuid(),
                FindingId = "  ignored-outside-snapshot  ",
                Action = FindingReviewAction.RecordDisposition,
                Disposition = FindingDisposition.Accepted,
                OccurredAtUtc = t0.AddMinutes(11),
            },
            new FindingReviewEventRecord
            {
                EventId = Guid.NewGuid(),
                FindingId = "open-1",
                Action = FindingReviewAction.RecordDisposition,
                Disposition = null,
                OccurredAtUtc = t0.AddMinutes(12),
            },
        ];

        List<RiskExceptionRecord> waivers =
        [
            new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                FindingId = "waived-1",
            },
            new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                FindingId = "  waived-1  ",
            },
        ];

        RunFindingDispositionCoverage? coverage =
            RunFindingDispositionCoverageBuilder.Build(snapshot, events, waivers);

        coverage.Should().NotBeNull();
        coverage!.OpenCount.Should().Be(2);
        coverage.AcceptedCount.Should().Be(0);
        coverage.DeferredCount.Should().Be(2);
        coverage.NeedsEvidenceCount.Should().Be(1);
        coverage.RemediatedCount.Should().Be(1);
        coverage.RejectedNotApplicableCount.Should().Be(1);
        coverage.WaivedCount.Should().Be(1);
    }

    private static FindingReviewEventRecord Review(
        string findingId,
        FindingDisposition disposition,
        DateTimeOffset occurredAtUtc)
    {
        return new FindingReviewEventRecord
        {
            EventId = Guid.NewGuid(),
            FindingId = findingId,
            Action = FindingReviewAction.RecordDisposition,
            Disposition = disposition,
            OccurredAtUtc = occurredAtUtc,
        };
    }
}
