using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlRelationalSliceBackfillCoreTests
{
    [Theory]
    [InlineData(0, 0, false)]
    [InlineData(0, 3, true)]
    [InlineData(2, 3, false)]
    [InlineData(5, 0, false)]
    public void SliceNeedsBackfill_returns_true_only_when_slice_empty_and_source_has_items(
        int sliceRowCount,
        int sourceItemCount,
        bool expected)
    {
        SqlRelationalSliceBackfillCore.SliceNeedsBackfill(sliceRowCount, sourceItemCount)
            .Should()
            .Be(expected);
    }
}
