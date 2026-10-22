using System.Text;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Notifications;

using ArchLucid.Api.Security;

/// <summary>Public unsubscribe endpoint for weekly sponsor digest (signed token, no interactive auth).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/notifications/sponsor-digest")]
[EnableRateLimiting("registration")]
public sealed class SponsorDigestUnsubscribeController(
    ISponsorDigestUnsubscribeTokenFactory tokenFactory,
    ITenantSponsorDigestPreferencesRepository preferencesRepository) : ControllerBase
{
    private readonly ITenantSponsorDigestPreferencesRepository _preferencesRepository =
        preferencesRepository ?? throw new ArgumentNullException(nameof(preferencesRepository));

    private readonly ISponsorDigestUnsubscribeTokenFactory _tokenFactory =
        tokenFactory ?? throw new ArgumentNullException(nameof(tokenFactory));

    [HttpGet("unsubscribe")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnsubscribeAsync([FromQuery] string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return this.BadRequestProblem(
                "token query parameter is required.",
                ProblemTypes.ValidationFailed);
        }

        if (!_tokenFactory.TryParseTenant(token, out Guid tenantId))
        {
            return this.BadRequestProblem(
                "Unsubscribe token is invalid or expired.",
                ProblemTypes.ValidationFailed);
        }

        await _preferencesRepository.TryDisableEmailAsync(tenantId, cancellationToken);

        return Content(
            "Sponsor digest email has been turned off for this tenant.",
            "text/plain",
            Encoding.UTF8);
    }
}
