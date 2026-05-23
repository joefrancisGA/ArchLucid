using ArchLucid.Application.Rendering;
using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     PDF parity builder for the <c>architecture-review-board</c> export profile using QuestPDF — already consolidated on this MIT/community-licensed,
///     native .NET renderer in <see cref="Rendering.QuestPdfDocumentBytes" /> so DOCX remains OpenXML while PDF mirrors section structure beside pilots/board packs.
/// </summary>
public sealed class ArchitectureReviewPdfBuilder
{
    internal const string DemoTenantExportWatermark = "DEMO — NOT A CUSTOMER OUTCOME";

    /// <summary>
    ///     Generates PDF bytes. When <paramref name="logoImageBytes" /> is supplied, renders a cover logo (PNG/JPEG; callers validate via
    ///     <see cref="ArchitectureReviewBoardCoverLogoValidator" />).
    /// </summary>
    public Task<byte[]> BuildAsync(
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        string? activeTrialExportNotice = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(model.RunId))
            throw new ArgumentException("RunId is required.", nameof(model));

        WhitelabelConfigurationValidator.ValidateIfProvided(whitelabel);

        DateTimeOffset exportTimestampUtc = TimeProvider.System.GetUtcNow();

        string footerText = ArchitectureReviewBoardExportTraceFooter.ComposePageFooterText(
            ArchitectureReviewDocxBuilder.ResolveFooterText(whitelabel),
            model.RunId,
            exportTimestampUtc,
            activeTrialExportNotice);

        byte[] pdf = QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page => ComposeCoverPage(page, model, whitelabel, logoImageBytes, footerText, activeTrialExportNotice, exportTimestampUtc));

            container.Page(page => ComposeDocumentBody(page, model, footerText));
        });

        return Task.FromResult(pdf);
    }

    internal static string ComposePageFooterText(string baseFooter, string? activeTrialExportNotice)
    {
        if (string.IsNullOrWhiteSpace(activeTrialExportNotice))
            return baseFooter;

        return string.IsNullOrWhiteSpace(baseFooter)
            ? activeTrialExportNotice
            : $"{baseFooter} · {activeTrialExportNotice}";
    }

    private static void ComposeCoverPage(
        PageDescriptor page,
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        string footerText,
        string? activeTrialExportNotice,
        DateTimeOffset exportTimestampUtc)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Helvetica"));

        page.Footer().AlignCenter().Text(footerText).FontSize(8).FontColor(Colors.Grey.Darken1);

        if (!string.IsNullOrWhiteSpace(activeTrialExportNotice))
        {
            page.Background()
                .AlignCenter()
                .AlignMiddle()
                .Text(activeTrialExportNotice)
                .FontSize(36)
                .FontColor(Colors.Grey.Lighten3)
                .Italic();
        }

        if (model.IsDemoTenant)
        {
            page.Background()
                .AlignCenter()
                .AlignMiddle()
                .Text(DemoTenantExportWatermark)
                .FontSize(28)
                .FontColor(Colors.Grey.Lighten3)
                .Italic();
        }

        page.Content().AlignCenter().Column(column =>
        {
            ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
                model,
                whitelabel,
                exportTimestampUtc,
                activeTrialExportNotice);

            if (logoImageBytes is { Length: > 0 })
            {
                column.Item()
                    .MaxWidth(ArchitectureReviewBoardCoverPageContent.PdfLogoMaxWidthPoints)
                    .Image(Image.FromBinaryData(logoImageBytes))
                    .FitArea();
                column.Item().Height(16);
            }

            column.Item().Text(cover.Title).Bold().FontSize(22);
            column.Item().Height(8);

            if (!string.IsNullOrWhiteSpace(cover.Subtitle))
            {
                column.Item().Text(cover.Subtitle).SemiBold().FontSize(14);
                column.Item().Height(8);
            }

            if (!string.IsNullOrWhiteSpace(cover.PreparedForTenantName))
            {
                column.Item().Text($"Prepared for {cover.PreparedForTenantName}").FontSize(11);
                column.Item().Height(12);
            }

            column.Item().Text(cover.GeneratedOnLabel).FontSize(10).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(cover.DemoNotice))
            {
                column.Item().Height(8);
                column.Item()
                    .Text(cover.DemoNotice)
                    .FontSize(8)
                    .FontColor(Colors.Grey.Darken2)
                    .Italic();
            }

            column.Item().Height(22);

            column.Item().Text($"Review ID: {model.ReviewId:D}").FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Text($"Review (run) ID: {model.RunId.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(model.RequestId))
                column.Item().Text($"Request ID: {model.RequestId.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
                column.Item().Text($"Architecture snapshot version: {model.ManifestVersion.Trim()}").FontSize(8)
                    .FontColor(Colors.Grey.Darken2);

            column.Item().Height(36);

            column.Item()
                .Text(
                    "Terminology follows buyer-facing glossary: Review ↔ committed run; Architecture snapshot ↔ golden manifest.")
                .FontSize(8)
                .FontColor(Colors.Grey.Darken2)
                .Italic();
        });
    }

    private static void ComposeDocumentBody(PageDescriptor page, ArchitectureReviewBoardExportDocumentModel model, string footerText)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Helvetica"));

        page.Footer().AlignCenter().Text(footerText).FontSize(8).FontColor(Colors.Grey.Darken1);

        page.Content().Column(column =>
        {
            AddExecutiveSummary(column, model);
            AddSystemOverview(column, model);
            AddEvidenceReviewed(column, model);
            AddArchitectureDecisions(column, model);
            AddKeyRisks(column, model);
            AddPolicyFindings(column, model);
            AddAiAssistedAnalysis(column, model);
            AddTraceabilityAppendix(column, model);
            AddRecommendedNextActions(column, model);
        });
    }

    private static void AddExecutiveSummary(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Executive summary", firstMajorHeading: true);

        if (string.IsNullOrWhiteSpace(model.ExecutiveSummary))
            AddPlaceholder(column, "executive summary content");
        else
            AddMultilineBodyText(column, model.ExecutiveSummary);
    }

    private static void AddSystemOverview(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "System overview (architecture snapshot)", firstMajorHeading: false);

        IReadOnlyList<string> bullets = model.SystemOverviewBullets ?? [];

        if (bullets.Count == 0)
        {
            AddPlaceholder(column, "architecture snapshot overview items");

            return;
        }

        foreach (string line in bullets)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            AddBullet(column, line.Trim());
        }

        column.Item().Height(8);
    }

    private static void AddEvidenceReviewed(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Evidence reviewed", firstMajorHeading: false);

        IReadOnlyList<ArchitectureReviewBoardExportEvidenceItem> items = model.EvidenceReviewed ?? [];

        if (items.Count == 0)
        {
            AddPlaceholder(column, "evidence items");

            return;
        }

        foreach (ArchitectureReviewBoardExportEvidenceItem item in items)
        {
            string headline = string.IsNullOrWhiteSpace(item.Title) ? "(Untitled evidence)" : item.Title.Trim();

            column.Item().PaddingVertical(2).Text(headline).FontSize(9);

            if (!string.IsNullOrWhiteSpace(item.Detail))
                column.Item().Text(item.Detail.Trim()).FontSize(8).FontColor(Colors.Grey.Darken2);

            if (!string.IsNullOrWhiteSpace(item.Reference))
                column.Item().Text($"Reference: {item.Reference.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddArchitectureDecisions(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Architecture decisions", firstMajorHeading: false);

        IReadOnlyList<ArchitectureReviewBoardExportDecisionRow> rows = model.ArchitectureDecisions ?? [];

        if (rows.Count == 0)
        {
            AddPlaceholder(column, "architecture decisions");

            return;
        }

        foreach (ArchitectureReviewBoardExportDecisionRow row in rows)
        {
            string title = string.IsNullOrWhiteSpace(row.Title) ? "(Untitled decision)" : row.Title.Trim();

            column.Item().PaddingVertical(2).Text(title).FontSize(9);

            if (!string.IsNullOrWhiteSpace(row.Detail))
                AddMultilineBodyText(column, row.Detail);

            if (!string.IsNullOrWhiteSpace(row.RecordedAtUtcLabel))
                column.Item().Text($"Recorded: {row.RecordedAtUtcLabel.Trim()}").FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddKeyRisks(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Key risks", firstMajorHeading: false);

        IReadOnlyList<ArchitectureReviewBoardExportRiskRow> risks = model.KeyRisks ?? [];

        if (risks.Count == 0)
        {
            AddPlaceholder(column, "key risks at or above the export threshold");

            return;
        }

        foreach (ArchitectureReviewBoardExportRiskRow risk in risks)
        {
            string severity = string.IsNullOrWhiteSpace(risk.SeverityLabel) ? "Severity n/a" : risk.SeverityLabel.Trim();
            string summaryText = string.IsNullOrWhiteSpace(risk.Summary) ? "(No summary)" : risk.Summary.Trim();

            column.Item().PaddingVertical(2).Text($"{severity}: {summaryText}").FontSize(9);

            if (!string.IsNullOrWhiteSpace(risk.Detail))
                column.Item().Text(risk.Detail.Trim()).FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddPolicyFindings(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Policy findings", firstMajorHeading: false);

        IReadOnlyList<ArchitectureReviewBoardExportPolicyFindingRow> findings = model.PolicyFindings ?? [];

        if (findings.Count == 0)
        {
            AddPlaceholder(column, "policy evaluation results");

            return;
        }

        foreach (ArchitectureReviewBoardExportPolicyFindingRow row in findings)
        {
            string pack =
                string.IsNullOrWhiteSpace(row.PolicyPackNameOrId) ? "(Policy pack)" : row.PolicyPackNameOrId.Trim();
            string outcome = string.IsNullOrWhiteSpace(row.Outcome) ? "Outcome n/a" : row.Outcome.Trim();

            column.Item().PaddingVertical(2).Text($"{pack} — {outcome}").FontSize(9);

            if (!string.IsNullOrWhiteSpace(row.Detail))
                column.Item().Text(row.Detail.Trim()).FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddAiAssistedAnalysis(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "AI-assisted analysis", firstMajorHeading: false);

        column.Item()
            .Background(Colors.Grey.Lighten4)
            .Padding(10)
            .Text(
                "Findings requiring human disposition — model-assisted observations are advisory only. ArchLucid does not exercise autonomous authority over production posture.")
            .Bold()
            .FontSize(8)
            .FontColor(Colors.Grey.Darken3);

        column.Item().Height(10);

        IReadOnlyList<ArchitectureReviewBoardExportDispositionItem> items = model.AiDispositionFindings ?? [];

        if (items.Count == 0)
        {
            AddPlaceholder(column, "findings pending human disposition");

            return;
        }

        foreach (ArchitectureReviewBoardExportDispositionItem item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Summary))
                continue;

            column.Item().PaddingVertical(2).Text(item.Summary.Trim()).FontSize(9);

            if (!string.IsNullOrWhiteSpace(item.Context))
                column.Item().Text(item.Context.Trim()).FontSize(8).FontColor(Colors.Grey.Darken2);

            column.Item().Height(6);
        }
    }

    private static void AddTraceabilityAppendix(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Traceability appendix", firstMajorHeading: false);

        List<(string Key, string Value)> rows = [];

        if (!string.IsNullOrWhiteSpace(model.HttpCorrelationId))
            rows.Add(("HTTP correlation ID", model.HttpCorrelationId.Trim()));

        if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
            rows.Add(("Architecture snapshot version", model.ManifestVersion.Trim()));

        if (!string.IsNullOrWhiteSpace(model.ExtractorTimestampUtcLabel))
            rows.Add(("Extractor timestamp (UTC)", model.ExtractorTimestampUtcLabel.Trim()));

        foreach (ArchitectureReviewBoardExportTraceRow line in model.TraceabilityLines ?? [])
        {
            if (string.IsNullOrWhiteSpace(line.Label))
                continue;

            rows.Add((line.Label.Trim(), string.IsNullOrWhiteSpace(line.Value) ? "—" : line.Value.Trim()));
        }

        if (rows.Count == 0)
        {
            AddPlaceholder(column, "traceability references");

            return;
        }

        column.Item().PaddingVertical(4).Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.RelativeColumn(2);
                cols.RelativeColumn(3);
            });

            foreach ((string key, string value) in rows)
            {
                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(key).SemiBold();
                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(value);
            }
        });
    }

    private static void AddRecommendedNextActions(ColumnDescriptor column, ArchitectureReviewBoardExportDocumentModel model)
    {
        AddHeading(column, "Recommended next actions", firstMajorHeading: false);

        IReadOnlyList<string> actions = model.RecommendedNextActions ?? [];

        if (actions.Count == 0)
        {
            AddPlaceholder(column, "recommended next actions");

            return;
        }

        int index = 1;

        foreach (string action in actions)
        {
            if (string.IsNullOrWhiteSpace(action))
                continue;

            column.Item().PaddingVertical(2).Text($"{index}. {action.Trim()}").FontSize(9);
            index++;
        }

        column.Item().Height(8);
    }

    private static void AddHeading(ColumnDescriptor column, string text, bool firstMajorHeading)
    {
        float paddingTop = firstMajorHeading ? 0f : 12f;

        column.Item().PaddingTop(paddingTop).Text(text).Bold().FontSize(16);
    }

    private static void AddPlaceholder(ColumnDescriptor column, string itemPhrase)
    {
        column.Item().PaddingVertical(2).Text($"No {itemPhrase} recorded.").FontSize(8).FontColor(Colors.Grey.Darken2).Italic();

        column.Item().Height(8);
    }

    private static void AddBullet(ColumnDescriptor column, string text)
    {
        column.Item().PaddingVertical(1).Row(row =>
        {
            row.ConstantItem(12).Text("•").FontSize(10);
            row.RelativeItem().Text(text).FontSize(9);
        });
    }

    private static void AddMultilineBodyText(ColumnDescriptor column, string text)
    {
        foreach (string line in text.Replace("\r\n", "\n").Split('\n'))
        {
            string trimmed = line.TrimEnd();

            if (string.IsNullOrEmpty(trimmed))
                column.Item().Height(6);
            else
                column.Item().PaddingVertical(1).Text(trimmed).FontSize(9);
        }

        column.Item().Height(8);
    }
}
