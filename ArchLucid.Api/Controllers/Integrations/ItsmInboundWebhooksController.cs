using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Security;

using ArchLucid.Host.Core.Middleware;
using ArchLucid.Host.Core.Services.Delivery;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Integrations;

using ArchLucid.Api.Security;

/// <summary>Inbound ITSM vendor webhooks (shared-secret headers; no JWT).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/webhooks")]
[EnableRateLimiting("fixed")]
public sealed class ItsmInboundWebhooksController(
    IOptionsMonitor<IntegrationsItsmInboundOptions> options,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    ItsmInboundWebhookSyncService sync,
    IAuditService auditService) : ControllerBase
{
    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly ItsmInboundWebhookSyncService _sync =
        sync ?? throw new ArgumentNullException(nameof(sync));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("jira")]
    [MutatingAuditExcluded("Audit: ItsmInboundWebhookSyncService and payload-size guard log via IAuditService in ProcessJiraAsync.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> Jira(CancellationToken ct) =>
        ProcessJiraAsync(tenantId: null, ct);

    [HttpPost("jira/tenants/{tenantId:guid}")]
    [MutatingAuditExcluded("Audit: ItsmInboundWebhookSyncService and payload-size guard log via IAuditService in ProcessJiraAsync.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> JiraForTenant(Guid tenantId, CancellationToken ct) =>
        ProcessJiraAsync(tenantId, ct);

    [HttpPost("servicenow")]
    [MutatingAuditExcluded("Audit: ItsmInboundWebhookSyncService and payload-size guard log via IAuditService in ProcessServiceNowAsync.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> ServiceNow(CancellationToken ct) =>
        ProcessServiceNowAsync(tenantId: null, ct);

    [HttpPost("servicenow/tenants/{tenantId:guid}")]
    [MutatingAuditExcluded("Audit: ItsmInboundWebhookSyncService and payload-size guard log via IAuditService in ProcessServiceNowAsync.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> ServiceNowForTenant(Guid tenantId, CancellationToken ct) =>
        ProcessServiceNowAsync(tenantId, ct);

    private async Task<IActionResult> ProcessJiraAsync(Guid? tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            return this.BadRequestProblem("Tenant id is required.", ProblemTypes.ValidationFailed);

        InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(HttpContext);

        string? sharedSecret = await ResolveInboundSecretAsync(tenantId, TenantItsmConnectorProvider.Jira, ct)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(sharedSecret))
            return Unauthorized();

        InboundWebhookBoundedBodyReadResult bodyRead = await InboundWebhookBoundedBodyReader
            .ReadUtf8Async(Request, InboundWebhookBodyLimits.DefaultMaxUtf8Bytes, ct)
            .ConfigureAwait(false);

        if (!bodyRead.Succeeded)
        {
            await _auditService
                .LogAsync(
                    ItsmInboundWebhookSyncService.CreatePayloadTooLargeAudit(true, bodyRead.ObservedOrDeclaredBytes),
                    ct)
                .ConfigureAwait(false);

            return this.PayloadTooLargeProblem(
                "ITSM webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge);
        }

        string rawBody = bodyRead.Body!;
        int payloadUtf8Bytes = bodyRead.ObservedOrDeclaredBytes;

        string? token = Request.Headers["X-Jira-Token"].FirstOrDefault();

        if (!TryVerifyWebhookSecurity(_options.CurrentValue, sharedSecret, rawBody, token, out IActionResult? reject))
            return reject!;

        if (!TryParseWebhookJson(rawBody, out JsonDocument? doc, out IActionResult? parseReject))
            return parseReject!;

        using (doc)
        {
            ItsmInboundWebhookProcessResult r =
                await _sync.TryProcessJiraIssueUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId(), tenantId).ConfigureAwait(false);

            if (r.DurableAuditEvent is not null)
                await _auditService.LogAsync(r.DurableAuditEvent, ct).ConfigureAwait(false);

            if (!r.Accepted)
                return this.BadRequestProblem("Unrecognized Jira webhook payload.", ProblemTypes.ValidationFailed);

            return Ok();
        }
    }

    private async Task<IActionResult> ProcessServiceNowAsync(Guid? tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            return this.BadRequestProblem("Tenant id is required.", ProblemTypes.ValidationFailed);

        InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(HttpContext);

        string? sharedSecret = await ResolveInboundSecretAsync(tenantId, TenantItsmConnectorProvider.ServiceNow, ct)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(sharedSecret))
            return Unauthorized();

        InboundWebhookBoundedBodyReadResult bodyRead = await InboundWebhookBoundedBodyReader
            .ReadUtf8Async(Request, InboundWebhookBodyLimits.DefaultMaxUtf8Bytes, ct)
            .ConfigureAwait(false);

        if (!bodyRead.Succeeded)
        {
            await _auditService
                .LogAsync(
                    ItsmInboundWebhookSyncService.CreatePayloadTooLargeAudit(false, bodyRead.ObservedOrDeclaredBytes),
                    ct)
                .ConfigureAwait(false);

            return this.PayloadTooLargeProblem(
                "ITSM webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge);
        }

        string rawBody = bodyRead.Body!;
        int payloadUtf8Bytes = bodyRead.ObservedOrDeclaredBytes;

        string? token = Request.Headers["X-ServiceNow-Token"].FirstOrDefault();

        if (!TryVerifyWebhookSecurity(_options.CurrentValue, sharedSecret, rawBody, token, out IActionResult? reject))
            return reject!;

        if (!TryParseWebhookJson(rawBody, out JsonDocument? doc, out IActionResult? parseReject))
            return parseReject!;

        using (doc)
        {
            ItsmInboundWebhookProcessResult r =
                await _sync.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, ct, payloadUtf8Bytes, ResolveDeliveryId(), tenantId).ConfigureAwait(false);

            if (r.DurableAuditEvent is not null)
                await _auditService.LogAsync(r.DurableAuditEvent, ct).ConfigureAwait(false);

            if (!r.Accepted)
                return this.BadRequestProblem("Unrecognized ServiceNow webhook payload.", ProblemTypes.ValidationFailed);

            return Ok();
        }
    }

    private bool TryParseWebhookJson(
        string rawBody,
        [NotNullWhen(true)] out JsonDocument? doc,
        out IActionResult? reject)
    {
        try
        {
            doc = JsonDocument.Parse(rawBody);
            reject = null;

            return true;
        }
        catch (JsonException)
        {
            doc = null;
            reject = this.BadRequestProblem("Malformed ITSM webhook JSON body.", ProblemTypes.ValidationFailed);

            return false;
        }
    }

    private async Task<string?> ResolveInboundSecretAsync(
        Guid? tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken ct)
    {
        if (tenantId is { } scopedTenantId && scopedTenantId != Guid.Empty)
        {
            return await _credentialResolver
                .TryResolveInboundWebhookSecretAsync(scopedTenantId, provider, ct)
                .ConfigureAwait(false);
        }

        IntegrationsItsmInboundOptions inbound = _options.CurrentValue;

        if (!inbound.AllowDeploymentWideWebhookSecrets)
            return null;

        return provider switch
        {
            TenantItsmConnectorProvider.Jira => string.IsNullOrWhiteSpace(inbound.JiraWebhookSecret)
                ? null
                : inbound.JiraWebhookSecret,
            TenantItsmConnectorProvider.ServiceNow => string.IsNullOrWhiteSpace(inbound.ServiceNowWebhookSecret)
                ? null
                : inbound.ServiceNowWebhookSecret,
            TenantItsmConnectorProvider.AzureBoards => null,
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private string? ResolveDeliveryId()
    {
        string? deliveryId = Request.Headers[ItsmInboundWebhookReplayEventId.DeliveryIdHeaderName].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(deliveryId))
            return deliveryId.Trim();

        string? atlassianId =
            Request.Headers[ItsmInboundWebhookReplayEventId.AtlassianWebhookIdentifierHeaderName].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(atlassianId))
            return atlassianId.Trim();

        return null;
    }

    private bool TryVerifyWebhookSecurity(
        IntegrationsItsmInboundOptions o,
        string sharedSecret,
        string rawBody,
        string? vendorToken,
        out IActionResult? reject)
    {
        reject = null;

        if (!WebhookSecrets.SecureEquals(vendorToken, sharedSecret))
        {
            reject = Unauthorized();

            return false;
        }

        if (!TryValidateOptionalTimestampSkew(o, out reject))
            return false;

        if (!o.RequireBodyHmacSignature)
            return true;

        string? signature =
            Request.Headers[WebhookSignature.HeaderName].FirstOrDefault()
            ?? Request.Headers["X-ArchLucid-Signature"].FirstOrDefault();

        if (!WebhookSecrets.IsValidHmacSha256Signature(sharedSecret, rawBody, signature))
        {
            reject = Unauthorized();

            return false;
        }

        return true;
    }

    private bool TryValidateOptionalTimestampSkew(IntegrationsItsmInboundOptions o, out IActionResult? reject)
    {
        reject = null;

        if (o.WebhookTimestampSkewSeconds <= 0)
            return true;

        string? ts = Request.Headers["X-ArchLucid-Timestamp"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(ts))
            return true;

        if (WebhookSecrets.TimestampWithinSkew(TimeProvider.System.GetUtcNow(), ts, o.WebhookTimestampSkewSeconds))
            return true;

        reject = Unauthorized();

        return false;
    }
}
