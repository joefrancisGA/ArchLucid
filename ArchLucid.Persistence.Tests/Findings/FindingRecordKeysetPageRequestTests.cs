using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingRecordKeysetPageRequestTests
{
    [Fact]
    public void Validate_accepts_first_page_without_cursor()
    {
        FindingRecordKeysetPageRequest request = Create(cursorSortOrder: null, cursorFindingRecordId: null);

        request.Invoking(static r => r.Validate()).Should().NotThrow();
        request.HasCursor.Should().BeFalse();
    }

    [Fact]
    public void Validate_accepts_complete_cursor()
    {
        FindingRecordKeysetPageRequest request = Create(cursorSortOrder: 12, cursorFindingRecordId: Guid.NewGuid());

        request.Invoking(static r => r.Validate()).Should().NotThrow();
        request.HasCursor.Should().BeTrue();
    }

    [Fact]
    public void Validate_rejects_cursor_missing_finding_record_id()
    {
        FindingRecordKeysetPageRequest request = Create(cursorSortOrder: 12, cursorFindingRecordId: null);

        request.Invoking(static r => r.Validate())
            .Should().Throw<ArgumentException>()
            .WithMessage("*sortOrder and findingRecordId*");
    }

    [Fact]
    public void Validate_rejects_cursor_missing_sort_order()
    {
        FindingRecordKeysetPageRequest request = Create(cursorSortOrder: null, cursorFindingRecordId: Guid.NewGuid());

        request.Invoking(static r => r.Validate()).Should().Throw<ArgumentException>();
        request.HasCursor.Should().BeFalse();
    }

    private static FindingRecordKeysetPageRequest Create(int? cursorSortOrder, Guid? cursorFindingRecordId) =>
        new(
            Guid.NewGuid(),
            cursorSortOrder,
            cursorFindingRecordId,
            CursorPriorityRank: null,
            Severity: null,
            Category: null,
            FindingType: null,
            Take: 25,
            OrderByPriority: false);
}
