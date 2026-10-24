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
    public void FilterInMemory_trims_padded_label_filter()
    {
        ComparisonRecord match = Record("labeled", label: "release-1");
        ComparisonRecord other = Record("other", label: "release-2");

        List<ComparisonRecord> filtered = ComparisonRecordRepositoryCore
            .FilterInMemory([match, other], null, null, null, null, null, null, null, "  release-1\n", null)
            .ToList();

        filtered.Should().ContainSingle().Which.ComparisonRecordId.Should().Be("labeled");
    }

    [Fact]
    public void FilterInMemory_trims_padded_comparison_type_filter()
    {
        ComparisonRecord match = Record("typed", comparisonType: "end-to-end-replay");
        ComparisonRecord other = Record("other", comparisonType: "export-record-diff");

        List<ComparisonRecord> filtered = ComparisonRecordRepositoryCore
            .FilterInMemory([match, other], "  end-to-end-replay\n", null, null, null, null, null, null, null, null)
            .ToList();

        filtered.Should().ContainSingle().Which.ComparisonRecordId.Should().Be("typed");
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
        IReadOnlyList<string>? tags = null,
        string comparisonType = "run-vs-run",
        string? label = null) =>
        new()
        {
            ComparisonRecordId = id,
            ComparisonType = comparisonType,
            Label = label,
            CreatedUtc = createdUtc ?? DateTime.UtcNow,
            Tags = tags?.ToList() ?? [],
        };
}
