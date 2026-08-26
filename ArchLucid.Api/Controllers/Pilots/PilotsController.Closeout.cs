using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("closeout")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IPilotsApplicationService.CreateCloseoutAsync logs PilotCloseoutRecorded.")]
    public async Task<IActionResult> PostCloseout(
        [FromBody] PilotCloseoutPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        try
        {
            PilotCloseoutCreateResult result = await _pilots.CreateCloseoutAsync(
                body.RunId,
                body.BaselineHours,
                body.SpeedScore,
                body.ManifestPackageScore,
                body.TraceabilityScore,
                body.Notes,
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new { closeoutId = result.CloseoutId });
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
