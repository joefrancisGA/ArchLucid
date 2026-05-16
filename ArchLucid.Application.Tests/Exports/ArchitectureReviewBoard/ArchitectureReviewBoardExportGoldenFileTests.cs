using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportGoldenFileTests
{
    /// <summary>
    ///     Structural regression guard: update <c>Golden/architecture-review-board-section-headings-order.txt</c> only when section titles/order intentionally change.
    /// </summary>
    [Fact]
    public async Task Docx_section_heading_sequence_matches_golden_file()
    {
        IReadOnlyList<string> goldenLines = ArchitectureReviewBoardExportTestModels.LoadGoldenSectionHeadingOrder();

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, CancellationToken.None);

        IReadOnlyList<string> actual = ArchitectureReviewBoardDocxTestHelpers.ExtractSectionHeadingsInOrder(bytes);

        actual.Should().Equal(goldenLines, "Section headings changed; update the golden file if this is deliberate.");
    }
}
