using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Models.E2e;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Security;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Billing;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.E2e;

using ArchLucid.Api.Security;

/// <summary>
///     Non-production harness for live E2E (trial clock + billing activation). Gated by shared secret; returns 404 when
///     disabled.
/// </summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/e2e")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class E2EHarnessController(
    IWebHostEnvironment environment,
    IOptionsMonitor<E2EHarnessOptions> harnessOptions,
    ITenantRepository tenantRepository,
    BillingWebhookTrialActivator billingWebhookTrialActivator,
    IPlatformUserRepository platformUserRepository,
    ILocalTrialJwtIssuer jwtIssuer) : ControllerBase
{
    private readonly BillingWebhookTrialActivator _billingWebhookTrialActivator =
        billingWebhookTrialActivator ?? throw new ArgumentNullException(nameof(billingWebhookTrialActivator));

    private readonly IWebHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    private readonly IOptionsMonitor<E2EHarnessOptions> _harnessOptions =
        harnessOptions ?? throw new ArgumentNullException(nameof(harnessOptions));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IPlatformUserRepository _platformUserRepository =
        platformUserRepository ?? throw new ArgumentNullException(nameof(platformUserRepository));

    private readonly ILocalTrialJwtIssuer _jwtIssuer =
        jwtIssuer ?? throw new ArgumentNullException(nameof(jwtIssuer));

    [HttpPost("trial/set-expires")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetTrialExpiresAsync(
        [FromBody] E2eHarnessTrialExpiresPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (!IsHarnessAuthorized())
            return this.NotFoundProblem(
                "E2E harness is not available or the request is not authorized.",
                ProblemTypes.ResourceNotFound);

        if (body is null || body.TenantId == Guid.Empty)
            return this.NotFoundProblem(
                "Invalid or missing request body for E2E harness endpoint.",
                ProblemTypes.ResourceNotFound);

        await _tenantRepository.E2eHarnessSetTrialExpiresUtcAsync(body.TenantId, body.ExpiresUtc, cancellationToken);

        return NoContent();
    }

    [HttpPost("billing/simulate-subscription-activated")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SimulateSubscriptionActivatedAsync(
        [FromBody] E2eHarnessBillingSimulatePostRequest? body,
        CancellationToken cancellationToken)
    {
        if (!IsHarnessAuthorized())
            return this.NotFoundProblem(
                "E2E harness is not available or the request is not authorized.",
                ProblemTypes.ResourceNotFound);

        if (body is null ||
            body.TenantId == Guid.Empty ||
            body.WorkspaceId == Guid.Empty ||
            body.ProjectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(body.ProviderSubscriptionId))

            return this.NotFoundProblem(
                "Invalid or missing request body for E2E harness endpoint.",
                ProblemTypes.ResourceNotFound);

        if (!Enum.TryParse(body.CheckoutTier.Trim(), true, out BillingCheckoutTier tier))

            tier = BillingCheckoutTier.Team;

        string tierStorageCode = BillingTierCode.FromCheckoutTier(tier);
        string checkoutLabel = BillingTierCode.CheckoutTierLabel(tier);
        string provider = string.IsNullOrWhiteSpace(body.Provider) ? "Noop" : body.Provider.Trim();
        string subscriptionId = body.ProviderSubscriptionId.Trim();
        string rawJson =
            $$"""{"simulated":true,"provider":"{{provider}}","subscription":"{{subscriptionId}}","tier":"{{checkoutLabel}}"}""";

        await _billingWebhookTrialActivator.OnSubscriptionActivatedAsync(
            body.TenantId,
            body.WorkspaceId,
            body.ProjectId,
            provider,
            subscriptionId,
            tierStorageCode,
            checkoutLabel,
            1,
            1,
            rawJson,
            cancellationToken);

        return NoContent();
    }

    /// <summary>
    ///     Seeds a platform user and returns a Reader-scoped pre-auth JWT for private-beta invite-accept E2E (TB-927).
    /// </summary>
    [HttpPost("platform-users")]
    [ProducesResponseType(typeof(E2eHarnessPlatformUserPostResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePlatformUserAsync(
        [FromBody] E2eHarnessPlatformUserPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (!IsHarnessAuthorized())
        {
            return this.NotFoundProblem(
                "E2E harness is not available or the request is not authorized.",
                ProblemTypes.ResourceNotFound);
        }

        if (body?.Email is null || string.IsNullOrWhiteSpace(body.Email))
        {
            return this.NotFoundProblem(
                "Invalid or missing request body for E2E harness endpoint.",
                ProblemTypes.ResourceNotFound);
        }

        if (!IdentityEmailNormalizer.TryNormalize(body.Email, out string normalizedEmail, out string displayEmail))
        {
            return this.NotFoundProblem(
                "Invalid or missing request body for E2E harness endpoint.",
                ProblemTypes.ResourceNotFound);
        }

        PlatformUserRecord user = await _platformUserRepository.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = displayEmail,
                NormalizedPrimaryEmail = normalizedEmail,
                DisplayName = displayEmail,
                Status = PlatformUserStatus.Active,
            },
            cancellationToken).ConfigureAwait(false);

        (Guid tenantId, Guid workspaceId, Guid projectId) = TrialLocalJwtScopeDefaults.Resolve();

        string preAuthAccessToken = _jwtIssuer.IssueAccessToken(
            user.Id,
            displayEmail,
            ArchLucidRoles.Reader,
            tenantId,
            workspaceId,
            projectId,
            user.AuthVersion);

        return StatusCode(
            StatusCodes.Status201Created,
            new E2eHarnessPlatformUserPostResponse
            {
                PlatformUserId = user.Id,
                PreAuthAccessToken = preAuthAccessToken,
            });
    }

    private bool IsHarnessAuthorized()
    {
        if (_environment.IsProduction())
            return false;

        E2EHarnessOptions o = _harnessOptions.CurrentValue;

        if (!_environment.IsDevelopment() && !o.Enabled)
            return false;

        string? configured = o.SharedSecret?.Trim();

        if (string.IsNullOrEmpty(configured))
            return false;

        string? header = Request.Headers["X-ArchLucid-E2e-Harness-Secret"].FirstOrDefault();

        return ConstantTimeEquals(header, configured);
    }

    private static bool ConstantTimeEquals(string? a, string? b)
    {
        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b))
            return false;

        ReadOnlySpan<byte> ab = Encoding.UTF8.GetBytes(a);
        ReadOnlySpan<byte> bb = Encoding.UTF8.GetBytes(b);

        return ab.Length == bb.Length && CryptographicOperations.FixedTimeEquals(ab, bb);
    }
}
