using System.Text;

using ArchLucid.Api.Models.Billing;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Billing;

/// <summary>Hosted checkout for trial conversion (provider selected via <c>Billing:Provider</c>).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/billing")]
public sealed class BillingCheckoutController(
    IBillingProviderRegistry billingProviderRegistry,
    IBillingLedger billingLedger,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly IBillingProviderRegistry _billingProviderRegistry =
        billingProviderRegistry ?? throw new ArgumentNullException(nameof(billingProviderRegistry));

    private readonly IBillingLedger _billingLedger = billingLedger ?? throw new ArgumentNullException(nameof(billingLedger));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpPost("checkout")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [ProducesResponseType(typeof(BillingCheckoutResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckoutAsync(
        [FromBody] BillingCheckoutPostRequest? body,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (await _billingLedger.TenantHasActiveSubscriptionAsync(scope.TenantId, cancellationToken))
        {
            return this.ConflictProblem(
                "An active billing subscription already exists for this tenant.",
                ProblemTypes.Conflict);
        }

        if (body is null ||
            string.IsNullOrWhiteSpace(body.ReturnUrl) ||
            string.IsNullOrWhiteSpace(body.CancelUrl))
        {
            return this.BadRequestProblem(
                "ReturnUrl, CancelUrl, and TargetTier are required.",
                ProblemTypes.ValidationFailed);
        }

        BillingCheckoutTier tier = ParseCheckoutTier(body.TargetTier);

        BillingCheckoutRequest request = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            TargetTier = tier,
            Seats = body.Seats,
            Workspaces = body.Workspaces,
            BillingEmail = body.BillingEmail,
            ReturnUrl = body.ReturnUrl.Trim(),
            CancelUrl = body.CancelUrl.Trim(),
        };

        IBillingProvider provider = _billingProviderRegistry.ResolveActiveProvider();

        BillingCheckoutResult result;

        try
        {
            result = await provider.CreateCheckoutSessionAsync(request, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return Ok(
            new BillingCheckoutResponseDto
            {
                CheckoutUrl = result.CheckoutUrl,
                ProviderSessionId = result.ProviderSessionId,
                ExpiresUtc = result.ExpiresUtc,
            });
    }

    private static BillingCheckoutTier ParseCheckoutTier(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return BillingCheckoutTier.Team;
        }

        return label.Trim() switch
        {
            "Pro" => BillingCheckoutTier.Pro,
            "Enterprise" => BillingCheckoutTier.Enterprise,
            _ => BillingCheckoutTier.Team,
        };
    }
}
