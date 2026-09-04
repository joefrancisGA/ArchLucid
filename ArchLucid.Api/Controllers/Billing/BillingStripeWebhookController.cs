using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Billing;

using ArchLucid.Api.Security;

/// <summary>Stripe billing webhooks (signature verified inside <see cref="StripeBillingProvider" />).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/billing/webhooks")]
[EnableRateLimiting("fixed")]
public sealed class BillingStripeWebhookController(StripeBillingProvider stripeBillingProvider) : ControllerBase
{
    private readonly StripeBillingProvider _stripeBillingProvider =
        stripeBillingProvider ?? throw new ArgumentNullException(nameof(stripeBillingProvider));

    [HttpPost("stripe")]
    [Consumes("application/json")]
    public Task<IActionResult> StripeWalletAsync(CancellationToken cancellationToken) =>
        HandleStripeWebhookAsync(StripeBillingWebhookRoute.Wallet, cancellationToken);

    [HttpPost("stripe/subscriptions")]
    [Consumes("application/json")]
    public Task<IActionResult> StripeSubscriptionsAsync(CancellationToken cancellationToken) =>
        HandleStripeWebhookAsync(StripeBillingWebhookRoute.Subscription, cancellationToken);

    private async Task<IActionResult> HandleStripeWebhookAsync(
        StripeBillingWebhookRoute route,
        CancellationToken cancellationToken)
    {
        InboundWebhookBoundedBodyReadResult bodyRead = await InboundWebhookBoundedBodyReader
            .ReadUtf8Async(Request, InboundWebhookBodyLimits.DefaultMaxUtf8Bytes, cancellationToken)
            .ConfigureAwait(false);

        if (!bodyRead.Succeeded)
        {
            return this.PayloadTooLargeProblem(
                "Stripe webhook payload exceeds maximum size.",
                ProblemTypes.RequestPayloadTooLarge);
        }

        string signature = InboundWebhookHeaderReader.ExtractFirstNonEmptyHeader(Request.Headers["Stripe-Signature"]);

        BillingWebhookInbound inbound = new()
        {
            RawBody = bodyRead.Body!,
            StripeSignatureHeader = string.IsNullOrWhiteSpace(signature) ? null : signature,
            StripeWebhookRoute = route
        };

        BillingWebhookHandleResult result =
            await _stripeBillingProvider.HandleWebhookAsync(inbound, cancellationToken);

        if (result.IsReplayRejected)
            return Ok();

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorDetail ?? "Stripe webhook rejected.", ProblemTypes.BadRequest);

        return Ok();
    }
}
