using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonRecordRepositoryCoreTests
{
    [Fact]
    public void ClampLimit_defaults_and_caps()
    {
        ComparisonRecordRepositoryCore.ClampLimit(0).Should().Be(ComparisonRecordRepositoryCore.DefaultLimit);
        ComparisonRecordRepositoryCore.ClampLimit(1_000).Should().Be(ComparisonRecordRepositoryCore.MaxLimit);
    }

    [Fact]
    public void ResolveOrderColumn_maps_aliases()
    {
        ComparisonRecordRepositoryCore.ResolveOrderColumn("type").Should().Be("ComparisonType");
        ComparisonRecordRepositoryCore.ResolveOrderColumn(null).Should().Be("CreatedUtc");
    }

    [Fact]
    public void EnsureCursorPagingSupportsOrderColumn_rejects_non_created_sort()
    {
        Action act = () => ComparisonRecordRepositoryCore.EnsureCursorPagingSupportsOrderColumn("Label");

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void FilterInMemory_applies_tag_conjunction()
    {
        ComparisonRecord tagged = Record("a", tags: ["alpha", "beta"]);
        ComparisonRecord partial = Record("b", tags: ["alpha"]);
        ComparisonRecord none = Record("c", tags: ["gamma"]);

        List<ComparisonRecord> filtered = ComparisonRecordRepositoryCore
            .FilterInMemory([tagged, partial, none], null, null, null, null, null, null, null, null, ["alpha", "beta"])
            .ToList();

        filtered.Should().ContainSingle().Which.ComparisonRecordId.Should().Be("a");
    }

    [Fact]
    public void MatchesCursor_respects_desc_order()
    {
        ComparisonRecord older = Record("older", createdUtc: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        ComparisonRecord newer = Record("newer", createdUtc: new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc));

        ComparisonRecordRepositoryCore.MatchesCursor(
                older,
                newer.CreatedUtc,
                newer.ComparisonRecordId,
                sortDescending: true)
            .Should()
            .BeTrue();

        ComparisonRecordRepositoryCore.MatchesCursor(
                newer,
                older.CreatedUtc,
                older.ComparisonRecordId,
                sortDescending: true)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void SerializeTagsForUpdate_returns_null_for_empty()
    {
        ComparisonRecordRepositoryCore.SerializeTagsForUpdate([]).Should().BeNull();
        ComparisonRecordRepositoryCore.SerializeTagsForUpdate(["a"]).Should().Contain("a");
    }

    private static ComparisonRecord Record(
        string id,
        DateTime? createdUtc = null,
        IReadOnlyList<string>? tags = null) =>
        new()
        {
            ComparisonRecordId = id,
            ComparisonType = "run-vs-run",
            CreatedUtc = createdUtc ?? DateTime.UtcNow,
            Tags = tags?.ToList() ?? [],
        };
}
