using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     PDF regressions focus on wire validity + payload drift — readable section titles are asserted on DOCX (<see cref="ArchitectureReviewBoardExportGoldenFileTests" />).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportPdfStructureTests
{
    [Fact]
    public async Task BuildAsync_distinct_document_models_emit_valid_pdf_shapes_and_differ_in_bytes()
    {
        ArchitectureReviewPdfBuilder sut = new();

        byte[] populated =
            await sut.BuildAsync(ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel(), whitelabel: null, logoImageBytes: null,
                CancellationToken.None);

        byte[] empty =
            await sut.BuildAsync(ArchitectureReviewBoardExportTestModels.CreateEmptySectionsModel(), whitelabel: null, logoImageBytes: null,
                CancellationToken.None);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(populated);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(empty);

        populated.Should().NotBeEquivalentTo(empty);
    }

    [Fact]
    public async Task BuildAsync_whitelabel_changes_pdf_payload_relative_to_default_for_same_model()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        byte[] png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        WhitelabelConfiguration whitelabel = new()
        {
            FirmDisplayName = "Litware Consulting Group",
            ClientEngagementTitle = "ARB engagement delta probe"
        };

        ArchitectureReviewPdfBuilder sut = new();

        byte[] defaultPdf = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, CancellationToken.None);

        byte[] brandedPdf = await sut.BuildAsync(model, whitelabel, png, CancellationToken.None);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(defaultPdf);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(brandedPdf);

        defaultPdf.Should().NotBeEquivalentTo(brandedPdf);
    }
}
