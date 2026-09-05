using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AnalysisReportsController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/docx/consulting")]
    [HttpPost("review/{runId}/analysis-report/export/docx/consulting")]
    [Authorize(Policy = ArchLucidPolicies.CanExportConsultingDocx)]
    [Produces("application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadConsultingDocx(
        [FromRoute] string runId,
        [FromBody] ConsultingDocxExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ConsultingDocxExportRequest();

        await ApplyConsultingWhitelabelPrefillAsync(runId, request, cancellationToken);

        RunDetailLookup loaded = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        if (Guid.TryParse(runId, out Guid runGuid))
        {
            await ConsultingDocxExportSealedReceiptGuard.EnsureVerifiedOrThrowAsync(
                runGuid,
                runId,
                _authorityQueryService,
                _manifestHashService,
                _scopeContextProvider.GetCurrentScope(),
                cancellationToken);
        }

        try
        {
            ArchitectureAnalysisRequest analysisRequest = new()
            {
                RunId = runId,
                PreloadedRunDetail = loaded.Detail,
                IncludeEvidence = request.IncludeEvidence,
                IncludeExecutionTraces = request.IncludeExecutionTraces,
                IncludeManifest = request.IncludeManifest,
                IncludeDiagram = request.IncludeDiagram,
                // Consulting template options are currently configured globally via IOptions;
                // the API request influences the analysis content via the Include* flags.
                IncludeSummary = true,
                IncludeDeterminismCheck = request.IncludeDeterminismCheck,
                DeterminismIterations = request.DeterminismIterations,
                IncludeManifestCompare = request.IncludeManifestCompare,
                CompareManifestVersion = request.CompareManifestVersion,
                IncludeAgentResultCompare = request.IncludeAgentResultCompare,
                CompareRunId = request.CompareRunId
            };

            ArchitectureAnalysisReport report = await architectureAnalysisService.BuildAsync(
                analysisRequest,
                cancellationToken);

            ConsultingDocxExportBranding? branding = ConsultingDocxExportBrandingMapper.TryCreate(
                request.ReviewBoardWhitelabelFirmDisplayName,
                request.ReviewBoardWhitelabelClientEngagementTitle,
                request.ReviewBoardWhitelabelLogoBase64,
                out string? brandingError);

            if (brandingError is not null)
                return this.BadRequestProblem(brandingError, ProblemTypes.ValidationFailed);

            byte[] bytes = await architectureAnalysisConsultingDocxExportService.GenerateDocxAsync(
                report,
                branding,
                cancellationToken);

            ResolvedConsultingDocxExportProfile resolvedProfile = consultingDocxExportProfileSelector.Resolve(
                request.TemplateProfile,
                ConsultingDocxExportAuditMapper.ToRecommendationRequest(request));

            PersistedAnalysisExportRequest persistedRequest =
                ConsultingDocxExportAuditMapper.ToPersistedRequest(request);

            const string consultingDocxExportType = "analysis-report-consulting-docx";

            await runExportAuditService.RecordAsync(
                runId,
                consultingDocxExportType,
                "docx",
                $"analysis-report-consulting-{runId}.docx",
                resolvedProfile.SelectedProfileName,
                resolvedProfile.SelectedProfileDisplayName,
                resolvedProfile.WasAutoSelected,
                resolvedProfile.ResolutionReason,
                loaded.Detail!.Run.CurrentManifestVersion,
                persistedRequest,
                cancellationToken: cancellationToken);

            return ApiFileResults.RangeBytes(
                Request,
                bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"analysis-report-consulting-{runId}.docx");
        }
        catch (ConflictException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Consulting DOCX export blocked for run '{RunId}'.", runId);

            string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedHashMismatch
                : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                    ? ProblemTypes.DecisionReceiptSealedIncomplete
                    : ProblemTypes.Conflict;

            return this.ConflictProblem(ex.Message, problemType);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Consulting DOCX export failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.ExportFailed);
        }
    }

    private async Task ApplyConsultingWhitelabelPrefillAsync(
        string runId,
        ConsultingDocxExportRequest request,
        CancellationToken cancellationToken)
    {
        ConsultingDocxWhitelabelHints hints = new()
        {
            FirmDisplayName = request.ReviewBoardWhitelabelFirmDisplayName,
            ClientEngagementTitle = request.ReviewBoardWhitelabelClientEngagementTitle,
        };

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            runId,
            hints,
            runExportRecordRepository,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(hints.FirmDisplayName))
        {
            request.ReviewBoardWhitelabelFirmDisplayName = hints.FirmDisplayName;
        }

        if (!string.IsNullOrWhiteSpace(hints.ClientEngagementTitle))
        {
            request.ReviewBoardWhitelabelClientEngagementTitle = hints.ClientEngagementTitle;
        }
    }
}
