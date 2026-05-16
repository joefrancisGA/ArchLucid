using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     Synthetic data for go-to-market architecture review board samples (no customer branding or real systems).
/// </summary>
internal static class ArchitectureReviewBoardMarketingSampleModels
{
    /// <summary>1×1 PNG placeholder (solid pixel — not a customer logo).</summary>
    internal static byte[] PlaceholderConsultantLogoPng { get; } =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    internal static WhitelabelConfiguration GoToMarketWhitelabel =>
        new()
        {
            FirmDisplayName = "Contoso Architecture Partners",
            ClientEngagementTitle = "Northwind Corp — architecture review board packet (sample)"
        };

    /// <summary>Fully populated sections with fictitious consultant / client names.</summary>
    internal static ArchitectureReviewBoardExportDocumentModel CreateGoToMarketSampleModel()
    {
        return new ArchitectureReviewBoardExportDocumentModel
        {
            ReviewId = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
            RunId = "northwind-demo-review-run-001",
            RequestId = "req-contoso-northwind-8842",
            SystemName = "Northwind Corp — regulated commerce platform",
            ManifestVersion = "mv-sample-2026-05",
            ExecutiveSummary =
                "Contoso Architecture Partners assessed Northwind Corp's regulated commerce architecture after finalize review of the committed architecture snapshot. "
                + "The engagement confirms traceable evidence, recorded architecture decisions, and actionable follow-ups suitable for board readout.",
            SystemOverviewBullets =
            [
                "Architecture snapshot covers «Northwind Corp — regulated commerce platform» with representative services and datastores for the pilot boundary.",
                "Governance metadata reflects sample risk and compliance posture used only for demonstration.",
                "Compliance tags and constraints are illustrative — replace with tenant-backed policy packs in production reviews."
            ],
            EvidenceReviewed =
            [
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Request narrative",
                    Detail =
                        "Northwind seeks to modernize checkout while preserving PCI isolation boundaries and regional residency commitments.",
                    Reference = "SAMPLE-RQ-01"
                },
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Constraint",
                    Detail = "EU-West processing for personally identifiable checkout telemetry.",
                    Reference = null
                },
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Required capability",
                    Detail = "Idempotent order intake under partial network partitions.",
                    Reference = null
                }
            ],
            ArchitectureDecisions =
            [
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = "RunEvent",
                    Detail = "FinalizeReviewGate: Golden manifest validated prior to board packet export (synthetic event).",
                    RecordedAtUtcLabel = "2026-05-16T14:00:00Z"
                }
            ],
            KeyRisks =
            [
                new ArchitectureReviewBoardExportRiskRow
                {
                    SeverityLabel = "Governance",
                    Summary = "Architecture snapshot risk classification is High (demo seed).",
                    Detail = "Illustrative only — customer manifests carry tenant-specific governance."
                },
                new ArchitectureReviewBoardExportRiskRow
                {
                    SeverityLabel = "Analysis warning",
                    Summary = "Model-assisted finding pending human disposition before sponsor sign-off.",
                    Detail = "Synthetic warning row for sample layout."
                }
            ],
            PolicyFindings =
            [
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = "Sample policy constraint #1",
                    Outcome = "Recorded on architecture snapshot",
                    Detail = "Encrypt regulated checkout payloads at rest and in transit."
                },
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = "Required control",
                    Outcome = "Required",
                    Detail = "Break-glass access to production paths requires dual approval."
                }
            ],
            AiDispositionFindings =
            [
                new ArchitectureReviewBoardExportDispositionItem
                {
                    Summary = "Model-assisted finding pending human disposition before sponsor sign-off.",
                    Context = "Operators should reconcile against evidence graph links before treating as authoritative."
                }
            ],
            TraceabilityLines =
            [
                new ArchitectureReviewBoardExportTraceRow
                {
                    Label = "Architecture snapshot created (UTC)",
                    Value = "2026-05-15T09:00:00.0000000Z"
                },
                new ArchitectureReviewBoardExportTraceRow { Label = "Build identifier (sample)", Value = "contoso-northwind-demo-7" },
                new ArchitectureReviewBoardExportTraceRow
                {
                    Label = "Reviewed manifest identifier",
                    Value = "b2222222-2222-2222-2222-222222222222"
                }
            ],
            RecommendedNextActions =
            [
                "Validate remediation plans against constraint: Encrypt regulated checkout payloads at rest and in transit.",
                "Triage analysis warning: Model-assisted finding pending human disposition before sponsor sign-off."
            ],
            HttpCorrelationId = "sample-corr-architecture-review-board",
            ExtractorTimestampUtcLabel = "2026-05-16T16:00:00Z"
        };
    }
}
