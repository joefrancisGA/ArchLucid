using ArchLucid.Api.Attributes;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Jobs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ApiConsultingDocxProfileRecommendationRequest =
    ArchLucid.Api.Models.ConsultingDocxProfileRecommendationRequest;
using AppConsultingDocxProfileRecommendationRequest =
    ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendationRequest;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AnalysisReportsController
{
    // idempotency-posture: dry-run-no-persist
    [HttpPost("analysis-report/export/docx/consulting/resolve-profile")]
    [ProducesResponseType(typeof(ConsultingDocxResolveProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ResolveConsultingDocxProfile(
        [FromBody] ConsultingDocxResolveProfileRequest? request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        // TemplateName is currently advisory only; the selector resolves based on the
        // requested profile key and recommendation inputs.
        ResolvedConsultingDocxExportProfile resolved = consultingDocxExportProfileSelector.Resolve(
            request.Profile,
            new AppConsultingDocxProfileRecommendationRequest());

        return Ok(new ConsultingDocxResolveProfileResponse
        {
            RequestedProfile = request.Profile,
            RequestedTemplateName = request.TemplateName,
            ResolvedProfile = resolved.SelectedProfileName,
            ResolvedProfileDisplayName = resolved.SelectedProfileDisplayName,
            WasAutoSelected = resolved.WasAutoSelected,
            ResolutionReason = resolved.ResolutionReason
        });
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/docx/consulting")]
    [HttpPost("review/{runId}/analysis-report/export/docx/consulting")]
    [Authorize(Policy = ArchLucidPolicies.CanExportConsultingDocx)]
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
        catch (InvalidOperationException ex)
        {
            logger.LogWarningWithSanitizedUserArg(ex, "Consulting DOCX export failed for run '{RunId}'.", runId);
            return this.InvalidOperationProblem(ex, ProblemTypes.ExportFailed);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("run/{runId}/analysis-report/export/docx/consulting/async")]
    [HttpPost("review/{runId}/analysis-report/export/docx/consulting/async")]
    [Authorize(Policy = ArchLucidPolicies.CanExportConsultingDocx)]
    [AsyncRequired]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadConsultingDocxAsync(
        [FromRoute] string runId,
        [FromBody] ConsultingDocxExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ConsultingDocxExportRequest();

        await ApplyConsultingWhitelabelPrefillAsync(runId, request, cancellationToken);

        RunDetailLookup loaded = await LoadRunDetailOrNotFoundAsync(runId, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        ConsultingDocxWorkUnit workUnit = new(
            ConsultingDocxJobPayloadMapper.ToPayload(runId, request),
            $"analysis-report-consulting-{runId}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        string jobId = await jobs.EnqueueAsync(workUnit, cancellationToken: cancellationToken);

        return Accepted(new AsyncJobResponse { JobId = jobId });
    }

    // idempotency-posture: dry-run-no-persist
    [HttpPost("analysis-report/export/docx/consulting/profiles/recommend")]
    [ProducesResponseType(typeof(ConsultingDocxProfileRecommendationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult RecommendConsultingProfiles(
        [FromBody] ApiConsultingDocxProfileRecommendationRequest? request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ConsultingDocxProfileRecommendation recommendation = consultingDocxTemplateRecommendationService.Recommend(
            new AppConsultingDocxProfileRecommendationRequest
            {
                Audience = request.Audience,
                ExternalDelivery = request.ExternalDelivery,
                ExecutiveFriendly = request.ExecutiveFriendly,
                RegulatedEnvironment = request.RegulatedEnvironment,
                NeedDetailedEvidence = request.NeedDetailedEvidence,
                NeedExecutionTraces = request.NeedExecutionTraces,
                NeedDeterminismOrCompareAppendices = request.NeedDeterminismOrCompareAppendices
            });

        return Ok(new ConsultingDocxProfileRecommendationResponse { Recommendation = recommendation });
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
