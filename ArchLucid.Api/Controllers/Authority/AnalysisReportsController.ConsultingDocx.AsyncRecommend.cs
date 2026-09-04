using ArchLucid.Api.Attributes;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Jobs;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ApiConsultingDocxProfileRecommendationRequest =
    ArchLucid.Api.Models.ConsultingDocxProfileRecommendationRequest;
using AppConsultingDocxProfileRecommendationRequest =
    ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendationRequest;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AnalysisReportsController
{
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
}
