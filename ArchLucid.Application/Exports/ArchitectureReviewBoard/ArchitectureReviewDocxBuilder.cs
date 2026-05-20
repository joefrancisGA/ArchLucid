using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Builds a DOCX for the <c>architecture-review-board</c> export profile from a hydrated
///     <see cref="ArchitectureReviewBoardExportDocumentModel" />.
/// </summary>
public sealed class ArchitectureReviewDocxBuilder
{
    /// <summary>
    ///     Generates DOCX bytes. When <paramref name="logoImageBytes" /> is supplied, embeds a cover logo (PNG/JPEG detected by magic bytes).
    /// </summary>
    public Task<byte[]> BuildAsync(
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(model);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(model.RunId))
            throw new ArgumentException("RunId is required.", nameof(model));

        WhitelabelConfigurationValidator.ValidateIfProvided(whitelabel);

        MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document(new Body());
            Body body = mainPart.Document.Body!;

            ArchitectureReviewDocxOpenXmlPrimitives.AddStylesPart(mainPart);

            string footerText = ResolveFooterText(whitelabel);

            AddCoverPageSection(mainPart, body, model, whitelabel, logoImageBytes);
            ArchitectureReviewDocxOpenXmlPrimitives.AddPageBreak(body);

            AddExecutiveSummarySection(body, model);
            AddSystemOverviewSection(body, model);
            AddEvidenceReviewedSection(body, model);
            AddArchitectureDecisionsSection(body, model);
            AddKeyRisksSection(body, model);
            AddPolicyFindingsSection(body, model);
            AddAiAssistedAnalysisSection(body, model);
            AddTraceabilityAppendixSection(body, model);
            AddRecommendedNextActionsSection(body, model);

            ArchitectureReviewDocxOpenXmlPrimitives.AttachDefaultFooter(mainPart, body, footerText);
            mainPart.Document.Save();
        }

        return Task.FromResult(stream.ToArray());
    }

    internal static string ResolveFooterText(WhitelabelConfiguration? whitelabel)
    {
        if (whitelabel is null)
            return "Prepared by ArchLucid";

        return whitelabel.ResolveFooterAttribution();
    }

    internal void AddCoverPageSection(
        MainDocumentPart mainPart,
        Body body,
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes)
    {
        if (logoImageBytes is { Length: > 0 })
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddImageToBody(mainPart, body, logoImageBytes, "Consultant logo",
                2_200_000L, 700_000L);
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        }

        if (whitelabel is not null)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, whitelabel.FirmDisplayName.Trim(), "DocTitle");
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, whitelabel.ClientEngagementTitle.Trim(),
                "DocSubtitle");
        }
        else
        {
            string title = model.IsDemoTenant
                ? "Architecture review board packet (DEMO)"
                : "Architecture review board packet";
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, title, "DocTitle");
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            string subtitle = string.IsNullOrWhiteSpace(model.SystemName) ? model.RunId.Trim() : model.SystemName.Trim();

            if (model.IsDemoTenant)
                subtitle += " (DEMO)";

            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, subtitle, "DocSubtitle");
        }

        if (model.IsDemoTenant)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                "Demo tenant — replace before publishing to executives.",
                "Subtle");
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Review ID: {model.ReviewId:D}", "BodyText");
        ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Review (run) ID: {model.RunId.Trim()}",
            "BodyText");

        if (!string.IsNullOrWhiteSpace(model.RequestId))
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Request ID: {model.RequestId.Trim()}",
                "BodyText");

        if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                $"Architecture snapshot version: {model.ManifestVersion.Trim()}",
                "BodyText");

        ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body,
            $"Generated UTC: {TimeProvider.System.GetUtcNow():O}",
            "BodyText");

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 4);
        ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body,
            "Terminology follows buyer-facing glossary: Review ↔ committed run; Architecture snapshot ↔ golden manifest.",
            "Subtle");
    }

    internal void AddExecutiveSummarySection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Executive summary");

        if (string.IsNullOrWhiteSpace(model.ExecutiveSummary))
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "executive summary content");
        else
            ArchitectureReviewDocxOpenXmlPrimitives.AddMultilineBodyText(body, model.ExecutiveSummary);
    }

    internal void AddSystemOverviewSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "System overview (architecture snapshot)");

        IReadOnlyList<string> bullets = model.SystemOverviewBullets ?? [];

        if (bullets.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "architecture snapshot overview items");

            return;
        }

        foreach (string line in bullets)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            ArchitectureReviewDocxOpenXmlPrimitives.AddBullet(body, line.Trim());
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body);
    }

    internal void AddEvidenceReviewedSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Evidence reviewed");

        IReadOnlyList<ArchitectureReviewBoardExportEvidenceItem> items = model.EvidenceReviewed ?? [];

        if (items.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "evidence items");

            return;
        }

        foreach (ArchitectureReviewBoardExportEvidenceItem item in items)
        {
            string headline = string.IsNullOrWhiteSpace(item.Title) ? "(Untitled evidence)" : item.Title.Trim();
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, headline, "BodyText");

            if (!string.IsNullOrWhiteSpace(item.Detail))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, item.Detail.Trim(), "Subtle");

            if (!string.IsNullOrWhiteSpace(item.Reference))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"Reference: {item.Reference.Trim()}",
                    "Subtle");

            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }
    }

    internal void AddArchitectureDecisionsSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Architecture decisions");

        IReadOnlyList<ArchitectureReviewBoardExportDecisionRow> rows = model.ArchitectureDecisions ?? [];

        if (rows.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "architecture decisions");

            return;
        }

        foreach (ArchitectureReviewBoardExportDecisionRow row in rows)
        {
            string title = string.IsNullOrWhiteSpace(row.Title) ? "(Untitled decision)" : row.Title.Trim();
            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, title, "BodyText");

            if (!string.IsNullOrWhiteSpace(row.Detail))
                ArchitectureReviewDocxOpenXmlPrimitives.AddMultilineBodyText(body, row.Detail);

            if (!string.IsNullOrWhiteSpace(row.RecordedAtUtcLabel))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body,
                    $"Recorded: {row.RecordedAtUtcLabel.Trim()}",
                    "Subtle");

            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }
    }

    internal void AddKeyRisksSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Key risks");

        IReadOnlyList<ArchitectureReviewBoardExportRiskRow> risks = model.KeyRisks ?? [];

        if (risks.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "key risks at or above the export threshold");

            return;
        }

        foreach (ArchitectureReviewBoardExportRiskRow risk in risks)
        {
            string severity = string.IsNullOrWhiteSpace(risk.SeverityLabel) ? "Severity n/a" : risk.SeverityLabel.Trim();
            string summaryText = string.IsNullOrWhiteSpace(risk.Summary) ? "(No summary)" : risk.Summary.Trim();

            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"{severity}: {summaryText}",
                "BodyText");

            if (!string.IsNullOrWhiteSpace(risk.Detail))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, risk.Detail.Trim(), "Subtle");

            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }
    }

    internal void AddPolicyFindingsSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Policy findings");

        IReadOnlyList<ArchitectureReviewBoardExportPolicyFindingRow> findings = model.PolicyFindings ?? [];

        if (findings.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "policy evaluation results");

            return;
        }

        foreach (ArchitectureReviewBoardExportPolicyFindingRow row in findings)
        {
            string pack =
                string.IsNullOrWhiteSpace(row.PolicyPackNameOrId) ? "(Policy pack)" : row.PolicyPackNameOrId.Trim();
            string outcome = string.IsNullOrWhiteSpace(row.Outcome) ? "Outcome n/a" : row.Outcome.Trim();

            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body,
                $"{pack} — {outcome}",
                "BodyText");

            if (!string.IsNullOrWhiteSpace(row.Detail))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, row.Detail.Trim(), "Subtle");

            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }
    }

    internal void AddAiAssistedAnalysisSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "AI-assisted analysis");

        ArchitectureReviewDocxOpenXmlPrimitives.AddCallout(body,
            "Findings requiring human disposition — model-assisted observations are advisory only. ArchLucid does not exercise autonomous authority over production posture.");

        IReadOnlyList<ArchitectureReviewBoardExportDispositionItem> items = model.AiDispositionFindings ?? [];

        if (items.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "findings pending human disposition");

            return;
        }

        foreach (ArchitectureReviewBoardExportDispositionItem item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Summary))
                continue;

            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, item.Summary.Trim(), "BodyText");

            if (!string.IsNullOrWhiteSpace(item.Context))
                ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, item.Context.Trim(), "Subtle");

            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }
    }

    internal void AddTraceabilityAppendixSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Traceability appendix");

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
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "traceability references");
        else
            ArchitectureReviewDocxOpenXmlPrimitives.AddKeyValueTable(body, rows);
    }

    internal void AddRecommendedNextActionsSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Recommended next actions");

        IReadOnlyList<string> actions = model.RecommendedNextActions ?? [];

        if (actions.Count == 0)
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "recommended next actions");

            return;
        }

        int index = 1;

        foreach (string action in actions)
        {
            if (string.IsNullOrWhiteSpace(action))
                continue;

            ArchitectureReviewDocxOpenXmlPrimitives.AddStyledParagraph(body, $"{index}. {action.Trim()}", "BodyText");
            index++;
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body);
    }
}
