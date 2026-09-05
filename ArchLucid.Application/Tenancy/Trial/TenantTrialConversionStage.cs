using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy.Trial;

/// <inheritdoc cref="ITenantTrialConversionStage" />
public sealed class TenantTrialConversionStage(
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IBillingTrialConversionGate billingTrialConversionGate) : ITenantTrialConversionStage
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBillingTrialConversionGate _billingTrialConversionGate =
        billingTrialConversionGate ?? throw new ArgumentNullException(nameof(billingTrialConversionGate));

    public async Task<TenantTrialConvertResult> ConvertTrialAsync(
        TenantTrialConvertBody? body,
        string actor,
        CancellationToken cancellationToken)
    {
        if (!TryMapRequestTier(body?.TargetTier, out TenantTier? tier, out string? tierError))
        {
            return new TenantTrialConvertResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = tierError,
            };
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return new TenantTrialConvertResult { Outcome = TenantTrialHttpOutcome.TenantNotFound };

        if (!string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
        {
            if (IsIdempotentConvertedRetry(tenant, tier))
                return new TenantTrialConvertResult { Outcome = TenantTrialHttpOutcome.Success };

            return new TenantTrialConvertResult
            {
                Outcome = TenantTrialHttpOutcome.Conflict,
                Message = "Tenant is not on an active self-service trial.",
            };
        }

        try
        {
            await _billingTrialConversionGate
                .EnsureManualConversionAllowedAsync(tenant.Id, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (BillingConversionBlockedException ex)
        {
            return new TenantTrialConvertResult { Outcome = TenantTrialHttpOutcome.Conflict, Message = ex.Message };
        }

        ArchLucidInstrumentation.RecordTrialConversion(
            TrialLifecycleStatus.Active,
            tier?.ToString() ?? "unspecified");

        await _tenantRepository.MarkTrialConvertedAsync(tenant.Id, tier, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantTrialConverted,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = tenant.Id,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { targetTier = body?.TargetTier }),
            },
            cancellationToken).ConfigureAwait(false);

        return new TenantTrialConvertResult { Outcome = TenantTrialHttpOutcome.Success };
    }

    private static bool TryMapRequestTier(string? label, out TenantTier? tier, out string? errorMessage)
    {
        tier = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(label))
            return true;

        string trimmed = label.Trim();

        if (string.Equals(trimmed, nameof(TenantTier.Enterprise), StringComparison.OrdinalIgnoreCase))
        {
            tier = TenantTier.Enterprise;
            return true;
        }

        if (string.Equals(trimmed, nameof(TenantTier.Standard), StringComparison.OrdinalIgnoreCase))
        {
            tier = TenantTier.Standard;
            return true;
        }

        errorMessage = $"TargetTier must be '{nameof(TenantTier.Standard)}' or '{nameof(TenantTier.Enterprise)}'.";
        return false;
    }

    private static bool IsIdempotentConvertedRetry(TenantRecord tenant, TenantTier? requestedTier)
    {
        if (!TrialLifecycleStatus.EqualsStatus(tenant.TrialStatus, TrialLifecycleStatus.Converted))
            return false;

        if (requestedTier is null)
            return true;

        return tenant.Tier == requestedTier.Value;
    }
}
