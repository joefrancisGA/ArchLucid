using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public static partial class ArchitectureReviewBoardExportDocumentFactory
{
    private static List<ArchitectureReviewBoardExportRiskRow> BuildKeyRisks(ArchitectureAnalysisReport report, ArchitectureRunDetail detail)
    {
        List<ArchitectureReviewBoardExportRiskRow> risks = [];
        GoldenManifest? m = report.Manifest ?? detail.Manifest;

        if (m is not null && !string.Equals(m.Governance.RiskClassification, "Moderate", StringComparison.OrdinalIgnoreCase))
            risks.Add(
                new ArchitectureReviewBoardExportRiskRow
                {
                    SeverityLabel = "Governance",
                    Summary = $"Architecture snapshot risk classification is {m.Governance.RiskClassification}.",
                    Detail = "Derived from committed governance metadata on the golden manifest."
                });

        foreach (string warning in report.Warnings ?? [])
        {
            if (string.IsNullOrWhiteSpace(warning))
                continue;

            risks.Add(
                new ArchitectureReviewBoardExportRiskRow
                {
                    SeverityLabel = "Analysis warning",
                    Summary = warning.Trim()
                });

            if (risks.Count >= 25)
                break;
        }

        return risks;
    }

    private static List<ArchitectureReviewBoardExportPolicyFindingRow> BuildPolicyFindings(ArchitectureRunDetail detail)
    {
        GoldenManifest? m = detail.Manifest;

        if (m is null)
            return [];

        List<ArchitectureReviewBoardExportPolicyFindingRow> rows = [];

        int i = 1;

        foreach (string constraint in m.Governance.PolicyConstraints ?? [])
        {
            if (string.IsNullOrWhiteSpace(constraint))
                continue;

            rows.Add(
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = $"Policy constraint #{i}",
                    Outcome = "Recorded on architecture snapshot",
                    Detail = constraint.Trim()
                });

            i++;

            if (rows.Count >= 20)
                break;
        }

        foreach (string control in m.Governance.RequiredControls ?? [])
        {
            if (string.IsNullOrWhiteSpace(control))
                continue;

            rows.Add(
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = "Required control",
                    Outcome = "Required",
                    Detail = control.Trim()
                });

            if (rows.Count >= 30)
                break;
        }

        return rows;
    }

    private static List<ArchitectureReviewBoardExportDispositionItem> BuildAiDisposition(ArchitectureAnalysisReport report)
    {
        List<ArchitectureReviewBoardExportDispositionItem> items = [];

        foreach (string w in report.Warnings ?? [])
        {
            if (string.IsNullOrWhiteSpace(w))
                continue;

            items.Add(
                new ArchitectureReviewBoardExportDispositionItem
                {
                    Summary = w.Trim(),
                    Context = "Operator disposition required before treating as authoritative governance signal."
                });

            if (items.Count >= 20)
                break;
        }

        return items;
    }

    private static List<ArchitectureReviewBoardExportTraceRow> BuildExtraTraceLines(ArchitectureRunDetail detail)
    {
        List<ArchitectureReviewBoardExportTraceRow> rows = [];

        if (detail.Manifest?.Metadata.CreatedUtc is DateTime createdUtc)
            rows.Add(new ArchitectureReviewBoardExportTraceRow { Label = "Architecture snapshot created (UTC)", Value = createdUtc.ToString("O") });

        if (detail.Run.GoldenManifestId is Guid goldenManifestId)
            rows.Add(
                new ArchitectureReviewBoardExportTraceRow { Label = "Reviewed manifest identifier", Value = goldenManifestId.ToString("D") });

        return rows;
    }

    private static List<string> BuildRecommendedActions(ArchitectureAnalysisReport report, ArchitectureRunDetail detail)
    {
        List<string> actions = [];
        GoldenManifest? m = detail.Manifest;

        foreach (string constraint in m?.Governance.PolicyConstraints ?? [])
        {
            if (string.IsNullOrWhiteSpace(constraint))
                continue;

            actions.Add($"Validate remediation plans against constraint: {constraint.Trim()}");

            if (actions.Count >= 8)
                break;
        }

        foreach (string w in report.Warnings ?? [])
        {
            if (string.IsNullOrWhiteSpace(w))
                continue;

            actions.Add($"Triage analysis warning: {w.Trim()}");

            if (actions.Count >= 15)
                break;
        }

        return actions;
    }
}
