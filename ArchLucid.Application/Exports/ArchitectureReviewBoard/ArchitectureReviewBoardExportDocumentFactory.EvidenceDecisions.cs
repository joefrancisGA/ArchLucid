using ArchLucid.Application.Analysis;
using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public static partial class ArchitectureReviewBoardExportDocumentFactory
{
    private const int MaxArchitectureDecisionTraceRows = 40;

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

        string serviceCoverage = m.Services.Count == 0
            ? ArchitectureManifestMarkdownSummaryExport.ServicesNotListedOnSnapshot
            : $"{m.Services.Count} services";
        string datastoreCoverage = m.Datastores.Count == 0
            ? ArchitectureManifestMarkdownSummaryExport.DatastoresNotListedOnSnapshot
            : $"{m.Datastores.Count} datastores";
        string relationshipCoverage = m.Relationships.Count == 0
            ? ArchitectureManifestMarkdownSummaryExport.RelationshipsNotListedOnSnapshot
            : $"Relationships modeled: {m.Relationships.Count}.";

        List<string> lines =
        [
            $"Architecture snapshot covers system «{systemLabel}» with {serviceCoverage} and {datastoreCoverage}.",
            $"{relationshipCoverage} Governance risk tier: {riskTier}; cost tier: {costTier}.",
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
            items.Add(
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = ArchitectureReviewBoardExportHonestyCopy.EvidenceConstraintTitle,
                    Detail = string.IsNullOrWhiteSpace(c)
                        ? ArchitectureReviewBoardExportHonestyCopy.EvidenceConstraintStoredEmpty
                        : c.Trim(),
                });
        }

        foreach (string cap in report.Evidence?.Request.RequiredCapabilities ?? [])
        {
            items.Add(
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = ArchitectureReviewBoardExportHonestyCopy.EvidenceRequiredCapabilityTitle,
                    Detail = string.IsNullOrWhiteSpace(cap)
                        ? ArchitectureReviewBoardExportHonestyCopy.EvidenceRequiredCapabilityStoredEmpty
                        : cap.Trim(),
                });
        }

        return items;
    }

    private static List<ArchitectureReviewBoardExportDecisionRow> BuildArchitectureDecisions(ArchitectureRunDetail detail)
    {
        IReadOnlyList<DecisionTraceDto> traces = detail.DecisionTraces ?? [];
        List<ArchitectureReviewBoardExportDecisionRow> rows = [];

        foreach (DecisionTraceDto trace in traces)
        {
            string title = FormatDecisionTraceTitle(trace);
            string detailText = string.Empty;

            string? recordedAtUtcLabel = null;

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
                recordedAtUtcLabel = FormatDecisionTraceRecordedAtUtcLabel(null);
            }
            else if (trace is RuleAuditTraceDto ruleAudit)
            {
                RuleAuditTracePayload payload = ruleAudit.RuleAudit;
                string ruleSetId = string.IsNullOrWhiteSpace(payload.RuleSetId)
                    ? "Rule set id was not stored."
                    : payload.RuleSetId.Trim();
                string ruleSetVersion = string.IsNullOrWhiteSpace(payload.RuleSetVersion)
                    ? "Rule set version was not stored."
                    : payload.RuleSetVersion.Trim();
                string appliedRules = FormatAppliedRuleIds(payload.AppliedRuleIds);
                string acceptedFindings = FormatRuleAuditFindingIdList(
                    payload.AcceptedFindingIds,
                    "Accepted finding ids were not stored.",
                    "Accepted finding ids were stored empty.");
                string rejectedFindings = FormatRuleAuditFindingIdList(
                    payload.RejectedFindingIds,
                    "Rejected finding ids were not stored.",
                    "Rejected finding ids were stored empty.");
                string requiredFindings = FormatRuleAuditFindingIdList(
                    payload.RequiredFindingIds,
                    "Required finding ids were not stored.",
                    "Required finding ids were stored empty.");
                string allowedFindings = FormatRuleAuditFindingIdList(
                    payload.AllowedFindingIds,
                    "Allowed finding ids were not stored.",
                    "Allowed finding ids were stored empty.");
                string preferredFindings = FormatRuleAuditFindingIdList(
                    payload.PreferredFindingIds,
                    "Preferred finding ids were not stored.",
                    "Preferred finding ids were stored empty.");
                detailText =
                    $"Rule set {ruleSetId} v{ruleSetVersion}; applied rules: {appliedRules}; accepted findings: {acceptedFindings}; rejected findings: {rejectedFindings}; required findings: {requiredFindings}; allowed findings: {allowedFindings}; preferred findings: {preferredFindings}.";
                recordedAtUtcLabel = FormatDecisionTraceRecordedAtUtcLabel(payload.CreatedUtc);
            }

            rows.Add(
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = title,
                    Detail = string.IsNullOrWhiteSpace(detailText) ? "Decision detail was not stored." : detailText,
                    RecordedAtUtcLabel = recordedAtUtcLabel,
                });

            if (rows.Count >= MaxArchitectureDecisionTraceRows)
            {
                break;
            }
        }

        if (traces.Count > MaxArchitectureDecisionTraceRows)
        {
            int omitted = traces.Count - MaxArchitectureDecisionTraceRows;
            rows.Add(
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = ArchitectureReviewBoardExportHonestyCopy.DecisionTracesOmittedTitle,
                    Detail = ArchitectureReviewBoardExportHonestyCopy.AdditionalDecisionTracesOmittedDetail(omitted),
                });
        }

        return rows;
    }

    private static string FormatAppliedRuleIds(IReadOnlyList<string>? appliedRuleIds)
    {
        if (appliedRuleIds is null)
        {
            return "Applied rules were not stored.";
        }

        if (appliedRuleIds.Count == 0)
        {
            return "Applied rules were stored empty.";
        }

        return string.Join(", ", appliedRuleIds);
    }

    private static string FormatDecisionTraceTitle(DecisionTraceDto trace) =>
        trace switch
        {
            RunEventTraceDto => "Run event",
            RuleAuditTraceDto => "Rule audit",
            _ => "Decision trace",
        };

    private static string FormatRuleAuditFindingIdList(
        IReadOnlyList<string> findingIds,
        string notStoredLabel,
        string storedEmptyLabel)
    {
        if (findingIds is null)
        {
            return notStoredLabel;
        }

        if (findingIds.Count == 0)
        {
            return storedEmptyLabel;
        }

        return string.Join(", ", findingIds);
    }

    private static string FormatDecisionTraceRecordedAtUtcLabel(DateTime? createdUtc)
    {
        if (createdUtc is null || createdUtc.Value == default)
        {
            return ArchitectureReviewBoardExportHonestyCopy.DecisionRecordedTimeNotStored;
        }

        return createdUtc.Value.ToUniversalTime().ToString("O");
    }
}
