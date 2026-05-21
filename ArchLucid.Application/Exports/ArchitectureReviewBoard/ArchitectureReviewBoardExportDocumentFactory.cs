using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Materializes <see cref="ArchitectureReviewBoardExportDocumentModel" /> from a finalized review aggregate plus analysis projection.
/// </summary>
public static class ArchitectureReviewBoardExportDocumentFactory
{
    /// <summary>
    ///     Stable surrogate identifier derived from <paramref name="runId" /> for continuity across DOCX/PDF exports.
    /// </summary>
    public static Guid CreateStableReviewId(string runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (Guid.TryParse(runId, out Guid parsed))
            return parsed;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out Guid parsedN))
            return parsedN;

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(runId.Trim()));

        return new Guid(hash.AsSpan(0, 16), true);
    }

    /// <summary>Builds the executive one-pager model (severity counts + AI summary + top finding titles).</summary>
    public static RunSummaryOnePagerDocumentModel CreateRunSummaryOnePager(
        ArchitectureRunDetail detail,
        string executiveSummary,
        IReadOnlyList<string> topFindingTitles)
        => RunSummaryOnePagerDocumentFactory.Create(detail, executiveSummary, topFindingTitles);

    /// <summary>Selects top High/Critical findings for the one-pager LLM prompt.</summary>
    public static IReadOnlyList<ArchitectureFinding> SelectRunSummaryTopFindings(ArchitectureRunDetail detail, int maxCount)
        => RunSummaryOnePagerDocumentFactory.SelectTopHighCriticalFindings(detail, maxCount);

    public static ArchitectureReviewBoardExportDocumentModel Create(
        ArchitectureRunDetail detail,
        ArchitectureAnalysisReport report,
        string? httpCorrelationId,
        string? extractorTimestampUtcLabel,
        bool? isDemoTenant = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(report);

        string runId = detail.Run.RunId ?? string.Empty;
        bool demo = isDemoTenant
                    ?? (ContosoRetailDemoIdentifiers.IsDemoRunId(runId)
                        || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run.RequestId));

        return new ArchitectureReviewBoardExportDocumentModel
        {
            ReviewId = CreateStableReviewId(runId),
            RunId = runId,
            RequestId = detail.Run.RequestId,
            SystemName = report.Manifest?.SystemName ?? report.Evidence?.SystemName ?? detail.Manifest?.SystemName,
            ManifestVersion = detail.Run.CurrentManifestVersion ?? detail.Manifest?.Metadata.ManifestVersion,
            ExecutiveSummary = report.Summary,
            HttpCorrelationId = httpCorrelationId,
            ExtractorTimestampUtcLabel = extractorTimestampUtcLabel,
            SystemOverviewBullets = BuildSystemOverviewBullets(detail, report),
            EvidenceReviewed = BuildEvidenceReviewed(report),
            ArchitectureDecisions = BuildArchitectureDecisions(detail),
            KeyRisks = BuildKeyRisks(report, detail),
            PolicyFindings = BuildPolicyFindings(detail),
            AiDispositionFindings = BuildAiDisposition(report),
            TraceabilityLines = BuildExtraTraceLines(detail),
            RecommendedNextActions = BuildRecommendedActions(report, detail),
            IsDemoTenant = demo,
        };
    }

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

        foreach (DecisionTrace trace in detail.DecisionTraces ?? [])
        {
            string title = trace.Kind.ToString();
            string detailText = string.Empty;

            if (trace is RunEventTrace runEvent)
            {
                RunEventTracePayload payload = runEvent.RunEvent;
                detailText = $"{payload.EventType}: {payload.EventDescription}".Trim();
            }
            else if (trace is RuleAuditTrace ruleAudit)
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
