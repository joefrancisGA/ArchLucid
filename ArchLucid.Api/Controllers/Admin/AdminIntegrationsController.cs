using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator integration maintenance endpoints (outbox recovery, webhook tooling).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/integrations")]
[EnableRateLimiting("expensive")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminIntegrationsController(IAdminDiagnosticsService diagnostics) : ControllerBase
{
    private readonly IAdminDiagnosticsService _diagnostics =
        diagnostics ?? throw new ArgumentNullException(nameof(diagnostics));

    /// <summary>Re-queues matching integration outbox dead-letter rows for publish retry.</summary>
    [HttpPost("outbox/retry-dead-letter")]
    [ProducesResponseType(typeof(IntegrationOutboxDeadLetterBulkRetryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RetryIntegrationOutboxDeadLetters(
        [FromBody] IntegrationOutboxDeadLetterBulkRetryRequest? body,
        CancellationToken cancellationToken = default)
    {
        IntegrationOutboxDeadLetterBulkRetryRequest request = body ?? new IntegrationOutboxDeadLetterBulkRetryRequest();

        if (request.MaxRows is < 1 or > 500)
        {
            return this.BadRequestProblem("MaxRows must be between 1 and 500.", ProblemTypes.ValidationFailed);
        }

        IntegrationOutboxDeadLetterBulkRetryResponse response =
            await _diagnostics.RetryIntegrationOutboxDeadLettersAsync(request, cancellationToken);

        return Ok(response);
    }
}
