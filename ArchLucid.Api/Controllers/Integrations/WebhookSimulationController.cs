using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Simulates an <c>AuthorityRunCompleted</c> webhook delivery to a subscriber URL (no persistence).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/webhooks")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class WebhookSimulationController(
    IOutboundWebhookDryRunService probe,
    IAuditService auditService) : ControllerBase
{
    /// <summary>POST synthetic <c>AuthorityRunCompleted</c> CloudEvents JSON to validate ITSM/webhook subscribers.</summary>
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(OutboundWebhookDryRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SimulateAsync(
        [FromBody] OutboundWebhookDryRunRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)

            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        OutboundWebhookDryRunResult outcome =
            await probe.ProbeAuthorityRunCompletedAsync(body.TargetUrl, body.SharedSecret, cancellationToken);

        OutboundWebhookDryRunResponse response = new()
        {
            TransportSucceeded = outcome.TransportSucceeded,
            StatusCode = outcome.StatusCode,
            ReasonPhrase = outcome.ReasonPhrase,
            ResponseBodyPreview = outcome.ResponseBodyPreview,
            ResponseBodyTruncated = outcome.ResponseBodyTruncated,
            Error = outcome.Error
        };

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.WebhookAuthorityRunCompletedSimulationExecuted,
                DataJson = JsonSerializer.Serialize(new
                {
                    targetAuthority = body.TargetUrl.GetLeftPart(UriPartial.Authority),
                    path = body.TargetUrl.AbsolutePath,
                    scheme = body.TargetUrl.Scheme,
                    hasSharedSecret = body.SharedSecret is { Length: > 0 },
                    transportSucceeded = outcome.TransportSucceeded,
                    statusCode = outcome.StatusCode,
                    reasonPhrase = outcome.ReasonPhrase,
                    error = outcome.Error
                })
            },
            cancellationToken);

        return Ok(response);
    }
}
