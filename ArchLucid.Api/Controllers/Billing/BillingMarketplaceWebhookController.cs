using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Billing;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Integration;
using ArchLucid.Persistence.Billing.AzureMarketplace;
using ArchLucid.Persistence.IntegrationOutbox;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Billing;

using ArchLucid.Api.Security;

/// <summary>
///     Azure Marketplace SaaS fulfillment webhooks (JWT verified inside
///     <see cref="AzureMarketplaceBillingProvider" />).
/// </summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/billing/webhooks")]
[EnableRateLimiting("fixed")]
public sealed class BillingMarketplaceWebhookController(
    AzureMarketplaceBillingProvider marketplaceBillingProvider,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<BillingMarketplaceWebhookController> logger) : ControllerBase
{
    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<BillingMarketplaceWebhookController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly AzureMarketplaceBillingProvider _marketplaceBillingProvider =
        marketplaceBillingProvider ?? throw new ArgumentNullException(nameof(marketplaceBillingProvider));

    [HttpPost("marketplace")]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarketplaceAsync(CancellationToken cancellationToken)
    {
        InboundWebhookBoundedBodyReadResult bodyRead = await InboundWebhookBoundedBodyReader
            .ReadUtf8Async(Request, InboundWebhookBodyLimits.DefaultMaxUtf8Bytes, cancellationToken)
            .ConfigureAwait(false);

        if (!bodyRead.Succeeded)
        {
            return this.PayloadTooLargeProblem(
                "Marketplace webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge);
        }

        string? bearer = InboundWebhookHeaderReader.ExtractBearerToken(Request.Headers.Authorization);

        BillingWebhookInbound inbound = new()
        {
            RawBody = bodyRead.Body!,
            MarketplaceAuthorizationBearer = bearer
        };

        BillingWebhookHandleResult result =
            await _marketplaceBillingProvider.HandleWebhookAsync(inbound, cancellationToken);

        if (result.IsReplayRejected)
            return Ok();

        if (result is
            {
                Succeeded: true, DuplicateIgnored: false, Returns202Accepted: false,
                MarketplaceWebhookReceived: not null
            })
            await MarketplaceWebhookIntegrationEventPublisher.TryPublishAsync(
                _integrationEventOutbox,
                _integrationEventPublisher,
                _integrationEventsOptions.CurrentValue,
                _logger,
                result.MarketplaceWebhookReceived,
                cancellationToken);

        if (result.DuplicateIgnored)
            return Ok();

        if (result is { Succeeded: true, Returns202Accepted: true })
            return StatusCode(StatusCodes.Status202Accepted);

        return result.Succeeded
            ? Ok()
            : this.BadRequestProblem(result.ErrorDetail ?? "Marketplace webhook rejected.", ProblemTypes.BadRequest);
    }
}
