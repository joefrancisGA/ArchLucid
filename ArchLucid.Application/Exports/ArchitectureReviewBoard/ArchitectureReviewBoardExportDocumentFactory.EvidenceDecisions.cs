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
        {
            return ["Architecture snapshot was not stored."];
        }

        string systemLabel = string.IsNullOrWhiteSpace(m.SystemName)
            ? "System name was not stored."
            : m.SystemName.Trim();

        string riskTier = ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(m.Governance);
        string costTier = ArchitectureManifestGovernanceExport.FormatCostClassificationForExport(m.Governance);

        List<string> lines =
        [
            $"Architecture snapshot covers system «{systemLabel}» with {m.Services.Count} services and {m.Datastores.Count} datastores.",
            $"Relationships modeled: {m.Relationships.Count}. Governance risk tier: {riskTier}; cost tier: {costTier}.",
            $"Compliance tags: {ArchitectureManifestGovernanceExport.FormatComplianceTagsForExport(m.Governance.ComplianceTags)}."
        ];

        return lines;
    }

    private static List<ArchitectureReviewBoardExportEvidenceItem> BuildEvidenceReviewed(ArchitectureAnalysisReport report)
    {
        List<ArchitectureReviewBoardExportEvidenceItem> items = [];

        if (report.Evidence is not null)
        {
            string? desc = report.Evidence.Request.Description;
            items.Add(
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Request narrative",
                    Detail = string.IsNullOrWhiteSpace(desc)
                        ? "Request narrative was not stored."
                        : desc.Trim(),
                });
        }

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
                string eventType = string.IsNullOrWhiteSpace(payload.EventType)
                    ? "Event type was not stored."
                    : payload.EventType.Trim();
                string eventDescription = string.IsNullOrWhiteSpace(payload.EventDescription)
                    ? "Event description was not stored."
                    : payload.EventDescription.Trim();
                detailText = $"{eventType}: {eventDescription}";
            }
            else if (trace is RuleAuditTraceDto ruleAudit)
            {
                RuleAuditTracePayload payload = ruleAudit.RuleAudit;
                string appliedRules = payload.AppliedRuleIds.Count > 0
                    ? string.Join(", ", payload.AppliedRuleIds)
                    : "Applied rules were not stored.";
                detailText = $"{payload.RuleSetId}; applied rules: {appliedRules}".Trim();
            }

            rows.Add(
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = title,
                    Detail = string.IsNullOrWhiteSpace(detailText) ? "Decision detail was not stored." : detailText
                });

            if (rows.Count >= 40)
                break;
        }

        return rows;
    }
}
