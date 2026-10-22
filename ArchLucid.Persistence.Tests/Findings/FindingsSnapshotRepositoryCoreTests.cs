using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotRepositoryCoreTests
{
    [Fact]
    public void ValidateFindingKeysetCursor_rejects_partial_cursor()
    {
        Action act = () => FindingsSnapshotRepositoryCore.ValidateFindingKeysetCursor(1, null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void MatchesFindingFilters_honors_normalized_filters()
    {
        Finding finding = new()
        {
            FindingId = "f-1",
            FindingType = "SecurityGap",
            Category = "Security",
            EngineType = "Compliance",
            Severity = FindingSeverity.Error,
            Title = "Gap",
        };

        FindingsSnapshotRepositoryCore
            .MatchesFindingFilters(finding, "Error", "Security", "SecurityGap")
            .Should()
            .BeTrue();

        FindingsSnapshotRepositoryCore
            .MatchesFindingFilters(finding, "Low", null, null)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void BuildKeysetPage_returns_has_more_when_extra_row_present()
    {
        Guid snapshotId = Guid.NewGuid();
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = snapshotId,
            Findings =
            [
                CreateFinding("f-1"),
                CreateFinding("f-2"),
            ],
        };

        List<FindingKeysetEnvelope> ordered = FindingsSnapshotRepositoryCore.OrderFindingEnvelopes(
            FindingsSnapshotRepositoryCore.BuildFindingEnvelopes(snapshot, snapshotId),
            orderByPriority: false);

        FindingRecordMetadataPage page = FindingsSnapshotRepositoryCore.BuildKeysetPage(
            ordered,
            orderByPriority: false,
            cursorSortOrder: null,
            cursorFindingRecordId: null,
            cursorPriorityRank: null,
            take: 1);

        page.Items.Should().ContainSingle();
        page.HasMore.Should().BeTrue();
    }

    [Fact]
    public void StableFindingRecordId_is_deterministic()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        Guid first = FindingsSnapshotRepositoryCore.StableFindingRecordId(snapshotId, 0, "finding-a");
        Guid second = FindingsSnapshotRepositoryCore.StableFindingRecordId(snapshotId, 0, "finding-a");

        first.Should().Be(second);
    }

    private static Finding CreateFinding(string findingId) =>
        new()
        {
            FindingId = findingId,
            FindingType = "SecurityGap",
            Category = "Security",
            EngineType = "Compliance",
            Severity = FindingSeverity.Warning,
            Title = findingId,
        };
}
