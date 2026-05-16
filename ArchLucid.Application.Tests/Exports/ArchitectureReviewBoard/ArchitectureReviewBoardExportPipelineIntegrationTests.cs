using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     End-to-end export checks without HTTP: factory hydration + DOCX/PDF builders against a synthetic finalized review.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportPipelineIntegrationTests
{
    [Fact]
    public async Task Factory_hydrated_model_round_trips_to_valid_docx_and_pdf_with_populated_sections()
    {
        (ArchitectureRunDetail Detail, ArchitectureAnalysisReport Report) = ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();

        ArchitectureReviewBoardExportDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.Create(Detail, Report, httpCorrelationId: "corr-integration-1", extractorTimestampUtcLabel: null);

        IReadOnlyList<string> expectedHeadings = ArchitectureReviewBoardExportTestModels.LoadGoldenSectionHeadingOrder();

        ArchitectureReviewDocxBuilder docxBuilder = new();
        byte[] docx = await docxBuilder.BuildAsync(model, whitelabel: null, logoImageBytes: null, CancellationToken.None);

        IReadOnlyList<string> docxHeadings = ArchitectureReviewBoardDocxTestHelpers.ExtractSectionHeadingsInOrder(docx);

        docxHeadings.Should().Equal(expectedHeadings);

        string docxXml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(docx);

        docxXml.Should().Contain("Synthetic executive summary produced by pipeline fixture.");
        docxXml.Should().Contain("Synthetic pipeline evidence narrative.");
        docxXml.Should().Contain("Synthetic.CommitGate");

        ArchitectureReviewPdfBuilder pdfBuilder = new();
        byte[] pdf = await pdfBuilder.BuildAsync(model, whitelabel: null, logoImageBytes: null, CancellationToken.None);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(pdf);
    }

    [Fact]
    public async Task Whitelabel_cover_strings_render_in_docx_and_pdf_for_same_export_seed()
    {
        (ArchitectureRunDetail Detail, ArchitectureAnalysisReport Report) = ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();

        ArchitectureReviewBoardExportDocumentModel model =
            ArchitectureReviewBoardExportDocumentFactory.Create(Detail, Report, httpCorrelationId: null, extractorTimestampUtcLabel: null);

        WhitelabelConfiguration whitelabel = new()
        {
            FirmDisplayName = "Tailspin Toys Consulting",
            ClientEngagementTitle = "ARB integration fixture engagement"
        };

        ArchitectureReviewDocxBuilder docxBuilder = new();
        byte[] docx = await docxBuilder.BuildAsync(model, whitelabel, logoImageBytes: null, CancellationToken.None);

        string docxXml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(docx);

        docxXml.Should().Contain("Tailspin Toys Consulting");
        docxXml.Should().Contain("ARB integration fixture engagement");

        ArchitectureReviewPdfBuilder pdfBuilder = new();
        byte[] pdf = await pdfBuilder.BuildAsync(model, whitelabel, logoImageBytes: null, CancellationToken.None);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(pdf);
    }
}
