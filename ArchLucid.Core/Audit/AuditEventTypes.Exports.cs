namespace ArchLucid.Core.Audit;

// Artifact synthesis, downloads, generated reports, and comparison record persistence.
public static partial class AuditEventTypes
{
    public const string ArtifactsGenerated = "ArtifactsGenerated";

    /// <summary>Artifact synthesis ended in hard failure (no usable bundle).</summary>
    public const string ArtifactSynthesisFailed = "ArtifactSynthesisFailed";

    /// <summary>Artifact synthesis produced a degraded bundle (see payload for missing artifact kinds).</summary>
    public const string ArtifactSynthesisPartial = "ArtifactSynthesisPartial";

    public const string ArtifactDownloaded = "ArtifactDownloaded";
    public const string BundleDownloaded = "BundleDownloaded";

    /// <summary>
    ///     In-product support bundle ZIP from <c>POST …/admin/support-bundle</c>. Payload is JSON with file name and
    ///     size bytes only (no raw bundle contents).
    /// </summary>
    public const string SupportBundleDownloaded = "SupportBundleDownloaded";

    /// <summary>
    ///     Structured support problem report accepted (<c>POST …/support/problem-reports</c>). Payload JSON
    ///     includes reference id and correlation metadata only (no evidence bodies).
    /// </summary>
    public const string SupportProblemReportSubmitted = "SupportProblemReportSubmitted";

    public const string RunExported = "RunExported";

    /// <summary>
    ///     Read-only export lineage verification completed (<c>GET …/runs/{runId}/export/verify</c>).
    ///     Payload JSON: runId, status (Match/Mismatch/NotAttested), committedHash, recomputedHash.
    /// </summary>
    public const string RunExportLineageVerified = "RunExportLineageVerified";

    /// <summary>Generic export download succeeded (DOCX/PDF/comparison file).</summary>
    public const string ExportDownloadSucceeded = "Export.DownloadSucceeded";

    /// <summary>Sponsor ROI board-pack Markdown/PDF export (<c>GET /v1/roi/sponsor-report/board-pack</c>).</summary>
    public const string SponsorRoiBoardPackExported = "SponsorRoiBoardPackExported";
    public const string RunExportFailed = "Export.Failed";

    /// <summary>Run export ZIP was successfully pushed to a customer-provided Azure Blob SAS URL.</summary>
    public const string RunExportBlobPushSucceeded = "RunExportBlobPushSucceeded";

    /// <summary>Run export ZIP push to a customer-provided Azure Blob SAS URL failed.</summary>
    public const string RunExportBlobPushFailed = "RunExportBlobPushFailed";

    /// <summary>
    ///     Run export ZIP blob push queued (HTTP 202): background upload emits <see cref="RunExportBlobPushSucceeded" />
    ///     or <see cref="RunExportBlobPushFailed" />.
    /// </summary>
    public const string RunExportBlobPushQueued = "RunExportBlobPushQueued";

    /// <summary>Run export blob push outbox row exhausted retries or failed destination re-validation at processing time.</summary>
    public const string RunExportBlobPushDeadLettered = "RunExportBlobPushDeadLettered";

    /// <summary>
    ///     Operator downloaded the advisory Terraform placeholder ZIP (
    ///     <c>GET /v1/artifacts/runs/{{runId}}/terraform-advisory-export</c>).
    /// </summary>
    public const string TerraformAdvisoryExportDownloaded = "TerraformAdvisoryExportDownloaded";

    /// <summary>
    ///     Emitted when a structured architecture analysis report is built via the primary analysis-report API (
    ///     <c>POST .../analysis-report</c>).
    /// </summary>
    public const string ArchitectureAnalysisReportGenerated = "ArchitectureAnalysisReportGenerated";

    /// <summary>
    ///     Emitted when the architecture-package DOCX export completes successfully (
    ///     <c>GET .../docx/runs/{{runId}}/architecture-package</c>).
    /// </summary>
    public const string ArchitectureDocxExportGenerated = "ArchitectureDocxExportGenerated";

    /// <summary>
    ///     Stakeholder DOCX value report generated for the current scope (
    ///     <c>POST /v1/value-report/generate</c>).
    /// </summary>
    public const string ValueReportGenerated = "ValueReportGenerated";

    /// <summary>Emitted when a replay export persists a new run export row (<c>RecordReplayExport</c> on replay POST).</summary>
    public const string ReplayExportRecorded = "ReplayExportRecorded";

    /// <summary>Emitted when <c>POST .../run/exports/compare/summary</c> persists an export-record diff comparison row.</summary>
    public const string ComparisonSummaryPersisted = "ComparisonSummaryPersisted";

    /// <summary>
    ///     Emitted when <c>POST .../run/compare/end-to-end/summary</c> persists an end-to-end comparison record (
    ///     application <c>ComparisonAuditService.RecordEndToEndAsync</c>).
    /// </summary>
    public const string EndToEndComparisonPersisted = "EndToEndComparisonPersisted";

    /// <summary>
    ///     Emitted when a comparison replay persists a new immutable comparison record (
    ///     application <c>ComparisonAuditService.RecordReplayOfAsync</c>).
    /// </summary>
    public const string ComparisonReplayPersisted = "ComparisonReplayPersisted";
}
