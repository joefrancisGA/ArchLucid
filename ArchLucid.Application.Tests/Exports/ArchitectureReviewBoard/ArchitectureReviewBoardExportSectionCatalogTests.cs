using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
public sealed class ArchitectureReviewBoardExportSectionCatalogTests
{
    [Fact]
    public void OrderedHeadings_matches_golden_section_order()
    {
        string goldenPath = Path.Combine(
            AppContext.BaseDirectory,
            "Exports",
            "ArchitectureReviewBoard",
            "Golden",
            "architecture-review-board-section-headings-order.txt");

        string[] expected = File.ReadAllLines(goldenPath)
            .Where(static line => line.Trim().Length > 0)
            .ToArray();

        ArchitectureReviewBoardExportSectionCatalog.OrderedHeadings
            .Should().BeEquivalentTo(expected, opts => opts.WithStrictOrdering());
    }

    [Fact]
    public void BodySectionOrder_contains_every_section_kind_once()
    {
        ArchitectureReviewBoardExportSectionCatalog.BodySectionOrder
            .Should().BeEquivalentTo(Enum.GetValues<ArchitectureReviewBoardExportSectionKind>());
    }
}
