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

namespace ArchLucid.Api.Controllers.Webhooks;

/// <summary>One-shot outbound webhook URL probe (no persistence).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/webhooks")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class OutboundWebhookDryRunController(
    IOutboundWebhookDryRunService probe,
    IAuditService auditService) : ControllerBase
{
    /// <summary>POST synthetic CloudEvents-shaped JSON (optionally signed) to validate subscriber URLs.</summary>
    [HttpPost("dry-run")]
    [ProducesResponseType(typeof(OutboundWebhookDryRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DryRunAsync(
        [FromBody] OutboundWebhookDryRunRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)

            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);


        OutboundWebhookDryRunResult outcome =
            await probe.ProbeAsync(body.TargetUrl, body.SharedSecret, cancellationToken);


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
                EventType = AuditEventTypes.OutboundWebhookDryRunProbeExecuted,
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
