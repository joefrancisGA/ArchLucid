using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Host.Core.Middleware;
using ArchLucid.Host.Core.Services.Delivery;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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
    IItsmInboundWebhookFacade webhookFacade,
    IAuditService auditService) : ControllerBase
{
    private readonly IItsmInboundWebhookFacade _webhookFacade =
        webhookFacade ?? throw new ArgumentNullException(nameof(webhookFacade));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("jira")]
    [MutatingAuditExcluded("Audit: IItsmInboundWebhookFacade.ProcessAsync logs via ItsmInboundWebhookSyncService.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> Jira(CancellationToken ct) =>
        ProcessAsync(TenantItsmConnectorProvider.Jira, tenantId: null, ct);

    [HttpPost("jira/tenants/{tenantId:guid}")]
    [MutatingAuditExcluded("Audit: IItsmInboundWebhookFacade.ProcessAsync logs via ItsmInboundWebhookSyncService.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> JiraForTenant(Guid tenantId, CancellationToken ct) =>
        ProcessAsync(TenantItsmConnectorProvider.Jira, tenantId, ct);

    [HttpPost("servicenow")]
    [MutatingAuditExcluded("Audit: IItsmInboundWebhookFacade.ProcessAsync logs via ItsmInboundWebhookSyncService.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> ServiceNow(CancellationToken ct) =>
        ProcessAsync(TenantItsmConnectorProvider.ServiceNow, tenantId: null, ct);

    [HttpPost("servicenow/tenants/{tenantId:guid}")]
    [MutatingAuditExcluded("Audit: IItsmInboundWebhookFacade.ProcessAsync logs via ItsmInboundWebhookSyncService.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> ServiceNowForTenant(Guid tenantId, CancellationToken ct) =>
        ProcessAsync(TenantItsmConnectorProvider.ServiceNow, tenantId, ct);

    private async Task<IActionResult> ProcessAsync(
        TenantItsmConnectorProvider provider,
        Guid? tenantId,
        CancellationToken ct)
    {
        InboundWebhookCorrelationBinder.EnsureIncomingCorrelationTags(HttpContext);

        InboundWebhookBoundedBodyReadResult bodyRead = await InboundWebhookBoundedBodyReader
            .ReadUtf8Async(Request, InboundWebhookBodyLimits.DefaultMaxUtf8Bytes, ct)
            .ConfigureAwait(false);

        if (!bodyRead.Succeeded)
        {
            await _auditService
                .LogAsync(
                    ItsmInboundWebhookSyncService.CreatePayloadTooLargeAudit(
                        provider == TenantItsmConnectorProvider.Jira,
                        bodyRead.ObservedOrDeclaredBytes),
                    ct)
                .ConfigureAwait(false);

            return this.PayloadTooLargeProblem(
                "ITSM webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge);
        }

        ItsmInboundWebhookProcessRequest request = new()
        {
            Provider = provider,
            TenantId = tenantId,
            RawBody = bodyRead.Body!,
            PayloadUtf8Bytes = bodyRead.ObservedOrDeclaredBytes,
            VendorToken = provider switch
            {
                TenantItsmConnectorProvider.Jira => Request.Headers["X-Jira-Token"].FirstOrDefault(),
                TenantItsmConnectorProvider.ServiceNow => Request.Headers["X-ServiceNow-Token"].FirstOrDefault(),
                _ => null,
            },
            DeliveryId = ResolveDeliveryId(),
            HmacSignature = Request.Headers[WebhookSignature.HeaderName].FirstOrDefault()
                ?? Request.Headers["X-ArchLucid-Signature"].FirstOrDefault(),
            TimestampHeader = Request.Headers["X-ArchLucid-Timestamp"].FirstOrDefault(),
        };

        ItsmInboundWebhookProcessHttpResult result = await _webhookFacade.ProcessAsync(request, ct)
            .ConfigureAwait(false);

        if (result.DurableAuditEvent is not null)
            await _auditService.LogAsync(result.DurableAuditEvent, ct).ConfigureAwait(false);

        return result.Outcome switch
        {
            ItsmInboundWebhookHttpOutcome.Success => Ok(),
            ItsmInboundWebhookHttpOutcome.Unauthorized => Unauthorized(),
            ItsmInboundWebhookHttpOutcome.ValidationFailed => this.BadRequestProblem(
                result.Message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            ItsmInboundWebhookHttpOutcome.PayloadTooLarge => this.PayloadTooLargeProblem(
                result.Message ?? "ITSM webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge),
            _ => throw new InvalidOperationException($"Unexpected webhook outcome: {result.Outcome}."),
        };
    }

    private string? ResolveDeliveryId()
    {
        string? deliveryId = Request.Headers[ItsmInboundWebhookReplayEventId.DeliveryIdHeaderName].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(deliveryId))
            return deliveryId.Trim();

        string? atlassianId =
            Request.Headers[ItsmInboundWebhookReplayEventId.AtlassianWebhookIdentifierHeaderName].FirstOrDefault();

        return !string.IsNullOrWhiteSpace(atlassianId) ? atlassianId.Trim() : null;
    }
}
