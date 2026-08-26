using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewDocxBuilder
{
    internal void AddSponsorReportSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Sponsor report");

        if (string.IsNullOrWhiteSpace(model.SponsorReport))
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "Sponsor report content");
        else
            ArchitectureReviewDocxOpenXmlPrimitives.AddMultilineBodyText(body, model.SponsorReport);
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

        if (!string.IsNullOrWhiteSpace(model.ExplanationConfidenceCallout))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddCallout(body, model.ExplanationConfidenceCallout.Trim());
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        }

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
