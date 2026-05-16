using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     Regenerates checked-in marketing samples when <c>ARCHLUCID_WRITE_GTM_ARB_SAMPLES=1</c> (optional <c>ARCHLUCID_REPO_ROOT</c>).
/// </summary>
[Trait("Category", "Tooling")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardMarketingSampleGeneratorTests
{
    [SkippableFact]
    public async Task Write_gtm_architecture_review_board_docx_and_pdf_when_env_set()
    {
        Skip.If(Environment.GetEnvironmentVariable("ARCHLUCID_WRITE_GTM_ARB_SAMPLES") != "1");

        string? root = Environment.GetEnvironmentVariable("ARCHLUCID_REPO_ROOT") ?? TryFindRepoRootWithDocsGoToMarket();

        Skip.If(string.IsNullOrWhiteSpace(root));

        string samplesDir = Path.Combine(root.Trim(), "docs", "go-to-market", "samples");
        Directory.CreateDirectory(samplesDir);

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardMarketingSampleModels.CreateGoToMarketSampleModel();
        WhitelabelConfiguration whitelabel = ArchitectureReviewBoardMarketingSampleModels.GoToMarketWhitelabel;
        byte[] logo = ArchitectureReviewBoardMarketingSampleModels.PlaceholderConsultantLogoPng;

        ArchitectureReviewDocxBuilder docxBuilder = new();
        ArchitectureReviewPdfBuilder pdfBuilder = new();

        byte[] docxBytes = await docxBuilder.BuildAsync(model, whitelabel, logo, CancellationToken.None);
        byte[] pdfBytes = await pdfBuilder.BuildAsync(model, whitelabel, logo, CancellationToken.None);

        string docxPath = Path.Combine(samplesDir, "architecture-review-report-sample.docx");
        string pdfPath = Path.Combine(samplesDir, "architecture-review-report-sample.pdf");

        await File.WriteAllBytesAsync(docxPath, docxBytes);
        await File.WriteAllBytesAsync(pdfPath, pdfBytes);

        IReadOnlyList<string> goldenOrder = ArchitectureReviewBoardExportTestModels.LoadGoldenSectionHeadingOrder();

        ArchitectureReviewBoardDocxTestHelpers.ExtractSectionHeadingsInOrder(docxBytes).Should().Equal(goldenOrder);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(pdfBytes);

        docxBytes.Length.Should().BeGreaterThan(3_000);
        pdfBytes.Length.Should().BeGreaterThan(400);
    }

    /// <summary>Walks ancestors of the test output dir until <c>docs/go-to-market</c> exists (repo root).</summary>
    private static string? TryFindRepoRootWithDocsGoToMarket()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory != null)
        {
            string gtm = Path.Combine(directory.FullName, "docs", "go-to-market");

            if (Directory.Exists(gtm))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }
}
