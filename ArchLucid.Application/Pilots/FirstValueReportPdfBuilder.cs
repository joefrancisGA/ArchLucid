using ArchLucid.Application.Rendering;
using ArchLucid.Contracts.Pilots;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     PDF projection of the canonical first-value-report Markdown produced by <see cref = "FirstValueReportBuilder"/>.
///     One sponsor-shareable PDF per committed run; the Markdown body remains the source of truth so PDF output
///     cannot drift from the existing <c>GET /v1/pilots/runs/{runId}/first-value-report</c> response.
/// </summary>
public sealed class FirstValueReportPdfBuilder(FirstValueReportBuilder markdownBuilder)
{
    private const string IncompletePdfBanner = "INCOMPLETE — NOT FOR EXTERNAL SPONSOR DISTRIBUTION";
    private const string DemoOnlyPdfBanner = "DEMO ONLY — NOT CUSTOMER ROI PROOF";
    private const string NeedsBaselinePdfBanner = "NEEDS BASELINE — REVIEW ROI NARRATIVE BEFORE SPONSOR SEND";
    private readonly FirstValueReportBuilder _markdownBuilder = markdownBuilder ?? throw new ArgumentNullException(nameof(markdownBuilder));

    /// <summary>Returns PDF bytes, or <see langword="null"/> when the run is missing (mirrors the Markdown sibling).</summary>
    public async Task<Byte[]?> BuildPdfAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(apiBaseForLinks);
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));
        FirstValueReportBuildResult? built = await _markdownBuilder.BuildReportAsync(runId, apiBaseForLinks, cancellationToken);
        if (built is null)
            return null;
        SponsorProofReadinessClassification readiness = built.SponsorProofReadiness;
        bool showSponsorCirculationWatermark = readiness is not SponsorProofReadinessClassification.Sendable;
        string watermarkBannerText = readiness switch
        {
            SponsorProofReadinessClassification.DemoOnly => DemoOnlyPdfBanner,
            SponsorProofReadinessClassification.NeedsBaseline => NeedsBaselinePdfBanner,
            _ => IncompletePdfBanner,
        };

        string markdown = built.Markdown;

        return QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                if (showSponsorCirculationWatermark)
                {
                    page.Foreground().AlignCenter()
                        .AlignMiddle()
                        .Rotate(45)
                        .Text(watermarkBannerText)
                        .Bold()
                        .FontSize(28)
                        .FontColor(Colors.Red.Medium.WithAlpha((byte)(0.18f * 255)));
                }

                page.Header().Column(header =>
                {
                    if (showSponsorCirculationWatermark)
                    {
                        header.Item()
                            .Background(Colors.Red.Lighten4)
                            .Padding(6)
                            .Text(watermarkBannerText)
                            .Bold()
                            .FontColor(Colors.Red.Darken3)
                            .FontSize(11);
                    }

                    header.Item().Text("ArchLucid — first value report (pilot)").Bold().FontSize(14);
                });
                page.Content().Column(column => MarkdownPdfRenderer.Render(column, markdown));
                page.Footer().Column(foot =>
                {
                    if (showSponsorCirculationWatermark)
                        foot.Item().AlignCenter().Text(watermarkBannerText).FontSize(9).Italic().FontColor(Colors.Grey.Medium);

                    foot.Item().AlignCenter().Text(text =>
                    {
                        text.Span("Generated from run ");
                        text.Span(runId).Bold();
                    });
                });
            });
        });
    }
}
