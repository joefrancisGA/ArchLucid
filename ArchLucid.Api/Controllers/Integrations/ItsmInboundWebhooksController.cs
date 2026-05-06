using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Inbound ITSM vendor webhooks (shared-secret headers; no JWT).</summary>
[ApiController]
[AllowAnonymous]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/webhooks")]
[EnableRateLimiting("fixed")]
public sealed class ItsmInboundWebhooksController(
    IOptionsMonitor<IntegrationsItsmInboundOptions> options,
    ItsmInboundWebhookSyncService sync,
    IAuditService auditService) : ControllerBase
{
    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ItsmInboundWebhookSyncService _sync =
        sync ?? throw new ArgumentNullException(nameof(sync));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("jira")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Jira([FromBody] JsonElement body, CancellationToken ct)
    {
        IntegrationsItsmInboundOptions o = _options.CurrentValue;

        if (string.IsNullOrWhiteSpace(o.JiraWebhookSecret))

            return Unauthorized();

        string? token = Request.Headers["X-Jira-Token"].FirstOrDefault();

        if (!string.Equals(token, o.JiraWebhookSecret, StringComparison.Ordinal))

            return Unauthorized();

        ItsmInboundWebhookProcessResult r = await _sync.TryProcessJiraIssueUpdateAsync(body, ct).ConfigureAwait(false);

        if (!r.Accepted)

            return BadRequest("Unrecognized Jira webhook payload.");

        if (r.DurableAuditEvent is not null)

            await _auditService.LogAsync(r.DurableAuditEvent, ct).ConfigureAwait(false);

        return Ok();
    }

    [HttpPost("servicenow")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ServiceNow([FromBody] JsonElement body, CancellationToken ct)
    {
        IntegrationsItsmInboundOptions o = _options.CurrentValue;

        if (string.IsNullOrWhiteSpace(o.ServiceNowWebhookSecret))

            return Unauthorized();

        string? token = Request.Headers["X-ServiceNow-Token"].FirstOrDefault();

        if (!string.Equals(token, o.ServiceNowWebhookSecret, StringComparison.Ordinal))

            return Unauthorized();

        ItsmInboundWebhookProcessResult r =
            await _sync.TryProcessServiceNowIncidentUpdateAsync(body, ct).ConfigureAwait(false);

        if (!r.Accepted)

            return BadRequest("Unrecognized ServiceNow webhook payload.");

        if (r.DurableAuditEvent is not null)

            await _auditService.LogAsync(r.DurableAuditEvent, ct).ConfigureAwait(false);

        return Ok();
    }
}
