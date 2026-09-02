using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Billing;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Billing;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/billing")]
public sealed class BillingCheckoutController(IBillingCheckoutFacade billingCheckoutFacade) : ControllerBase
{
    private readonly IBillingCheckoutFacade _billingCheckoutFacade =
        billingCheckoutFacade ?? throw new ArgumentNullException(nameof(billingCheckoutFacade));

    [HttpPost("checkout")]
    [SkipTrialWriteLimit]
    [MutatingAuditExcluded("Audit: IBillingCheckoutFacade.CreateCheckoutSessionAsync logs BillingCheckoutInitiated and BillingCheckoutCompleted.")]
    public async Task<IActionResult> CheckoutAsync([FromBody] BillingCheckoutPostRequest? body, CancellationToken cancellationToken)
    {
        BillingCheckoutSessionResult result = await _billingCheckoutFacade.CreateCheckoutSessionAsync(
            new BillingCheckoutPostBody
            {
                ReturnUrl = body?.ReturnUrl,
                CancelUrl = body?.CancelUrl,
                TargetTier = body?.TargetTier,
                Seats = body?.Seats,
                Workspaces = body?.Workspaces,
                BillingEmail = body?.BillingEmail,
            },
            User.Identity?.Name ?? "admin",
            cancellationToken);

        return result.Outcome switch
        {
            BillingCheckoutValidationOutcome.Success => Ok(new BillingCheckoutResponseDto
            {
                CheckoutUrl = result.Checkout!.CheckoutUrl,
                ProviderSessionId = result.Checkout.ProviderSessionId,
                ExpiresUtc = result.Checkout.ExpiresUtc,
            }),
            BillingCheckoutValidationOutcome.RequestBodyRequired => this.BadRequestProblem(
                "ReturnUrl, CancelUrl, and TargetTier are required.",
                ProblemTypes.ValidationFailed),
            BillingCheckoutValidationOutcome.ActiveSubscriptionConflict => this.ConflictProblem(
                "A billing subscription already exists for this tenant. Use Manage billing to update payment or cancel.",
                ProblemTypes.Conflict),
            BillingCheckoutValidationOutcome.ProviderError => this.BadRequestProblem(
                result.ErrorMessage ?? "Billing provider error.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unexpected checkout outcome: {result.Outcome}."),
        };
    }

    [HttpPost("portal")]
    [SkipTrialWriteLimit]
    [MutatingAuditExcluded("Audit: IBillingCheckoutFacade.CreatePortalSessionAsync logs BillingPortalInitiated and BillingPortalCompleted.")]
    public async Task<IActionResult> PortalAsync([FromBody] BillingPortalPostRequest? body, CancellationToken cancellationToken)
    {
        BillingPortalSessionResult result = await _billingCheckoutFacade.CreatePortalSessionAsync(
            new BillingPortalPostBody { ReturnUrl = body?.ReturnUrl },
            User.Identity?.Name ?? "admin",
            cancellationToken);

        return result.Outcome switch
        {
            BillingCheckoutValidationOutcome.Success => Ok(new BillingPortalResponseDto
            {
                PortalUrl = result.Portal!.PortalUrl,
                ProviderSessionId = result.Portal.ProviderSessionId,
            }),
            BillingCheckoutValidationOutcome.RequestBodyRequired => this.BadRequestProblem(
                "ReturnUrl is required.",
                ProblemTypes.ValidationFailed),
            BillingCheckoutValidationOutcome.ProviderError => this.BadRequestProblem(
                result.ErrorMessage ?? "Billing provider error.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unexpected portal outcome: {result.Outcome}."),
        };
    }

    [HttpGet("subscription")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    public async Task<IActionResult> GetSubscriptionStatusAsync(CancellationToken cancellationToken)
    {
        BillingSubscriptionStatusQueryResult result =
            await _billingCheckoutFacade.GetSubscriptionStatusAsync(cancellationToken);

        return Ok(new BillingSubscriptionStatusResponseDto
        {
            HasSubscription = result.HasSubscription,
            Provider = result.Provider,
            TierCode = result.TierCode,
            Status = result.Status,
            IsPaymentPastDue = result.IsPaymentPastDue,
        });
    }

    [HttpPost("marketplace/webhook-test")]
    [MutatingAuditExcluded("Audit: IBillingCheckoutFacade.TestMarketplaceWebhookAsync logs OutboundWebhookDryRunProbeExecuted.")]
    public async Task<IActionResult> TestMarketplaceWebhookAsync(CancellationToken cancellationToken)
    {
        OutboundWebhookDryRunResult outcome =
            (await _billingCheckoutFacade.TestMarketplaceWebhookAsync(User.Identity?.Name ?? "admin", cancellationToken)).Outcome;

        return Ok(new OutboundWebhookDryRunResponse
        {
            TransportSucceeded = outcome.TransportSucceeded,
            StatusCode = outcome.StatusCode,
            ReasonPhrase = outcome.ReasonPhrase,
            ResponseBodyPreview = outcome.ResponseBodyPreview,
            ResponseBodyTruncated = outcome.ResponseBodyTruncated,
            Error = outcome.Error,
        });
    }
}
