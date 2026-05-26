using System.Globalization;
using System.Text.Json;

using ArchLucid.Api.Models.Billing;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Billing;

/// <summary>Self-serve LLM prepaid wallet settings (TB-014).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/billing/wallet")]
public sealed class WalletController(
    ILlmTenantWalletService walletService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IOptionsMonitor<BillingOptions> billingOptions) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ILlmTenantWalletService _walletService =
        walletService ?? throw new ArgumentNullException(nameof(walletService));

    [HttpGet]
    [ProducesResponseType(typeof(LlmTenantWalletGetResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LlmTenantWalletGetResponse>> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        LlmTenantWalletView view = await _walletService.GetWalletAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(Map(view));
    }

    [HttpPut]
    [ProducesResponseType(typeof(LlmTenantWalletGetResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> PutAsync(
        [FromBody] LlmTenantWalletPutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        byte[] rowVersion = DecodeRowVersion(body.RowVersionBase64);

        LlmTenantWalletView? updated = await _walletService
            .UpdateWalletAsync(
                scope.TenantId,
                new LlmTenantWalletUpdateCommand
                {
                    AutoReplenishEnabled = body.AutoReplenishEnabled,
                    MonthlyCapUsd = body.MonthlyCapUsd,
                    StripeCustomerId = body.StripeCustomerId,
                    StripePaymentMethodId = body.StripePaymentMethodId,
                    ExpectedRowVersion = rowVersion,
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (updated is null)
            return this.ConflictProblem("Wallet settings could not be updated (validation or concurrency conflict).", ProblemTypes.Conflict);

        string actor = User.Identity?.Name ?? "operator";

        await _auditService
            .LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.LlmWalletSettingsUpdated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            autoReplenishEnabled = updated.AutoReplenishEnabled,
                            monthlyCapUsd = updated.MonthlyCapUsd,
                            hasPaymentMethod = updated.HasPaymentMethod,
                        }),
                },
                cancellationToken)
            .ConfigureAwait(false);

        return Ok(Map(updated));
    }

    private LlmTenantWalletGetResponse Map(LlmTenantWalletView view)
    {
        return new LlmTenantWalletGetResponse
        {
            BalanceUsd = view.BalanceUsd,
            AutoReplenishEnabled = view.AutoReplenishEnabled,
            MonthlyCapUsd = view.MonthlyCapUsd,
            RefillIncrementUsd = view.RefillIncrementUsd,
            RefillTriggerThresholdUsd = view.RefillTriggerThresholdUsd,
            AutoRefillsThisUtcMonthCount = view.AutoRefillsThisUtcMonthCount,
            LastRefillUtc = view.LastRefillUtc,
            HasPaymentMethod = view.HasPaymentMethod,
            StripePublishableKey = _billingOptions.CurrentValue.Stripe.PublishableKey,
            RowVersionBase64 = Convert.ToBase64String(view.RowVersion),
        };
    }

    private static byte[] DecodeRowVersion(string? rowVersionBase64)
    {
        if (string.IsNullOrWhiteSpace(rowVersionBase64))
            return [];

        try
        {
            return Convert.FromBase64String(rowVersionBase64.Trim());
        }
        catch (FormatException)
        {
            return [];
        }
    }
}
