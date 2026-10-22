using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public static partial class ArchitectureReviewBoardExportDocumentFactory
{
    private static IReadOnlyList<string> BuildSystemOverviewBullets(ArchitectureRunDetail detail, ArchitectureAnalysisReport report)
    {
        GoldenManifest? m = report.Manifest ?? detail.Manifest;

        if (m is null)
            return [];

        List<string> lines =
        [
            $"Architecture snapshot covers system «{m.SystemName}» with {m.Services.Count} services and {m.Datastores.Count} datastores.",
            $"Relationships modeled: {m.Relationships.Count}. Governance risk tier: {m.Governance.RiskClassification}; cost tier: {m.Governance.CostClassification}.",
            $"Compliance tags: {(m.Governance.ComplianceTags.Count > 0 ? string.Join(", ", m.Governance.ComplianceTags) : "none recorded")}."
        ];

        return lines;
    }

    private static List<ArchitectureReviewBoardExportEvidenceItem> BuildEvidenceReviewed(ArchitectureAnalysisReport report)
    {
        List<ArchitectureReviewBoardExportEvidenceItem> items = [];

        if (report.Evidence?.Request.Description is { Length: > 0 } desc)
            items.Add(
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Request narrative",
                    Detail = desc.Trim()
                });

        foreach (string c in report.Evidence?.Request.Constraints ?? [])
        {
            if (!string.IsNullOrWhiteSpace(c))
                items.Add(new ArchitectureReviewBoardExportEvidenceItem { Title = "Constraint", Detail = c.Trim() });
        }

        foreach (string cap in report.Evidence?.Request.RequiredCapabilities ?? [])
        {
            if (!string.IsNullOrWhiteSpace(cap))
                items.Add(new ArchitectureReviewBoardExportEvidenceItem { Title = "Required capability", Detail = cap.Trim() });
        }

        return items;
    }

    private static List<ArchitectureReviewBoardExportDecisionRow> BuildArchitectureDecisions(ArchitectureRunDetail detail)
    {
        List<ArchitectureReviewBoardExportDecisionRow> rows = [];

        foreach (DecisionTraceDto trace in detail.DecisionTraces ?? [])
        {
            string title = trace.Kind.ToString();
            string detailText = string.Empty;

            if (trace is RunEventTraceDto runEvent)
            {
                RunEventTracePayload payload = runEvent.RunEvent;
                detailText = $"{payload.EventType}: {payload.EventDescription}".Trim();
            }
            else if (trace is RuleAuditTraceDto ruleAudit)
            {
                RuleAuditTracePayload payload = ruleAudit.RuleAudit;
                detailText =
                    $"{payload.RuleSetId}; applied rules: {(payload.AppliedRuleIds.Count > 0 ? string.Join(", ", payload.AppliedRuleIds) : "none")}".Trim();
            }

            rows.Add(
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = title,
                    Detail = string.IsNullOrWhiteSpace(detailText) ? null : detailText
                });

            if (rows.Count >= 40)
                break;
        }

        return rows;
    }
}
