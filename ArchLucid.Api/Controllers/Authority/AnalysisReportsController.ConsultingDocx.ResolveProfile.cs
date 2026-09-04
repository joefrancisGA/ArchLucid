using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;

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
}
