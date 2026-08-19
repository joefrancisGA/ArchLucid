using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.ExecDigest;
using ArchLucid.Contracts.Notifications;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Notifications;

using ArchLucid.Api.Security;

/// <summary>
///     Public read-only sponsor view for weekly digest email deep links (signed token, no interactive auth) — TB-2196.
/// </summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/notifications/exec-digest")]
[EnableRateLimiting("registration")]
public sealed class ExecDigestSponsorDeepLinkController(IExecDigestSponsorDeepLinkReadService readService) : ControllerBase
{
    private readonly IExecDigestSponsorDeepLinkReadService _readService =
        readService ?? throw new ArgumentNullException(nameof(readService));

    [HttpGet("sponsor-view")]
    [ProducesResponseType(typeof(ExecDigestSponsorDeepLinkViewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSponsorViewAsync(
        [FromQuery] string? token,
        [FromQuery] string? runId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return this.BadRequestProblem(
                "token query parameter is required.",
                ProblemTypes.ValidationFailed);
        }

        ExecDigestSponsorDeepLinkViewResponse? response =
            await _readService.TryLoadViewAsync(token, runId, cancellationToken).ConfigureAwait(false);

        if (response is null)
        {
            return this.NotFoundProblem(
                "Sponsor digest link is invalid, expired, or no longer available.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(response);
    }
}
