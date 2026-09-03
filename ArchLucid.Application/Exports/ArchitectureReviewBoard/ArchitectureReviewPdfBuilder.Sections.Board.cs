using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewPdfBuilder
{
    private static void AddArchitectureDecisions(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.ArchitectureDecisions), firstMajorHeading);

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

    private static void AddKeyRisks(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.KeyRisks), firstMajorHeading);

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

    private static void AddPolicyFindings(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.PolicyFindings), firstMajorHeading);

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

    private static void AddAiAssistedAnalysis(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.AiAssistedAnalysis), firstMajorHeading);

        column.Item()
            .Background(Colors.Grey.Lighten4)
            .Padding(10)
            .Text(
                "Findings requiring human disposition — model-assisted observations are advisory only. ArchLucid does not exercise autonomous authority over production posture.")
            .Bold()
            .FontSize(8)
            .FontColor(Colors.Grey.Darken3);

        column.Item().Height(10);

        if (!string.IsNullOrWhiteSpace(model.ExplanationConfidenceCallout))
        {
            column.Item()
                .Background(Colors.Amber.Lighten4)
                .Padding(10)
                .Text(model.ExplanationConfidenceCallout.Trim())
                .FontSize(8)
                .FontColor(Colors.Amber.Darken3);

            column.Item().Height(8);
        }

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

    private static void AddRecommendedNextActions(
        ColumnDescriptor column,
        ArchitectureReviewBoardExportDocumentModel model,
        bool firstMajorHeading)
    {
        AddHeading(column, ArchitectureReviewBoardExportSectionCatalog.GetHeading(
            ArchitectureReviewBoardExportSectionKind.RecommendedNextActions), firstMajorHeading);

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
}
