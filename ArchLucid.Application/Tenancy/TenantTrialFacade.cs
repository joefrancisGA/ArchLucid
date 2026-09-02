using System.Text.Json;

using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantTrialFacade" />
public sealed class TenantTrialFacade(
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IBillingTrialConversionGate billingTrialConversionGate,
    ITrialIdentityUserRepository trialIdentityUsers,
    ISelfServiceTrialAbuseRepository trialAbuseRepository,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> trialLifecycleSchedulerOptions) : ITenantTrialFacade
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBillingTrialConversionGate _billingTrialConversionGate =
        billingTrialConversionGate ?? throw new ArgumentNullException(nameof(billingTrialConversionGate));

    private readonly ITrialIdentityUserRepository _trialIdentityUsers =
        trialIdentityUsers ?? throw new ArgumentNullException(nameof(trialIdentityUsers));

    private readonly ISelfServiceTrialAbuseRepository _trialAbuseRepository =
        trialAbuseRepository ?? throw new ArgumentNullException(nameof(trialAbuseRepository));

    private readonly IOptionsMonitor<TrialLifecycleSchedulerOptions> _trialLifecycleSchedulerOptions =
        trialLifecycleSchedulerOptions ?? throw new ArgumentNullException(nameof(trialLifecycleSchedulerOptions));

    /// <inheritdoc />
    public async Task<TenantTrialStatusQueryResult> GetTrialStatusAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return new TenantTrialStatusQueryResult { Outcome = TenantTrialHttpOutcome.TenantNotFound };

        if (string.IsNullOrWhiteSpace(tenant.TrialStatus))
        {
            return new TenantTrialStatusQueryResult
            {
                Outcome = TenantTrialHttpOutcome.Success,
                Status = BuildStatusResponse(tenant, daysRemaining: null),
            };
        }

        int? daysRemaining = null;

        if (!string.IsNullOrWhiteSpace(tenant.TrialStatus) && tenant.TrialExpiresUtc is not null)
        {
            daysRemaining = TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay(
                tenant,
                TimeProvider.System.GetUtcNow(),
                _trialLifecycleSchedulerOptions.CurrentValue);
        }

        return new TenantTrialStatusQueryResult
        {
            Outcome = TenantTrialHttpOutcome.Success,
            Status = BuildStatusResponse(tenant, daysRemaining),
        };
    }

    /// <inheritdoc />
    public async Task<TenantTrialLinkEntraResult> LinkEntraAsync(
        TenantTrialLinkEntraBody body,
        string actor,
        CancellationToken cancellationToken)
    {
        if (body.EntraTenantId == Guid.Empty)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = "EntraTenantId is required.",
            };
        }

        bool hasEmail = !string.IsNullOrWhiteSpace(body.LocalEmail);
        bool hasOid = !string.IsNullOrWhiteSpace(body.EntraOid);

        if (hasEmail != hasOid)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = "LocalEmail and EntraOid must both be supplied together, or both omitted.",
            };
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.TenantNotFound };

        string? normalizedLocal = null;

        if (hasEmail && hasOid)
        {
            normalizedLocal = TrialEmailNormalizer.Normalize(body.LocalEmail!);
            TrialIdentityUserRecord? localRow =
                await _trialIdentityUsers.GetByNormalizedEmailAsync(normalizedLocal, cancellationToken).ConfigureAwait(false);

            if (localRow is null)
            {
                return new TenantTrialLinkEntraResult
                {
                    Outcome = TenantTrialHttpOutcome.ValidationFailed,
                    Message = "No local trial identity exists for that email.",
                };
            }

            bool emailClaimedForTenant = await _trialAbuseRepository.HasEmailClaimForTenantAsync(
                normalizedLocal,
                scope.TenantId,
                cancellationToken).ConfigureAwait(false);

            if (!emailClaimedForTenant)
            {
                return new TenantTrialLinkEntraResult
                {
                    Outcome = TenantTrialHttpOutcome.ValidationFailed,
                    Message = "No local trial identity exists for that email.",
                };
            }

            string requestedOid = body.EntraOid!.Trim();

            if (localRow.LinkedEntraOid is { } existingLinkedOid && existingLinkedOid != requestedOid)
            {
                return new TenantTrialLinkEntraResult
                {
                    Outcome = TenantTrialHttpOutcome.Conflict,
                    Message = "That local identity is already linked to a different Entra user id.",
                };
            }
        }

        bool bound = await _tenantRepository
            .UpdateEntraTenantIdAsync(scope.TenantId, body.EntraTenantId, cancellationToken)
            .ConfigureAwait(false);

        if (!bound)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.Conflict,
                Message =
                    "Entra directory could not be bound (already bound to a different directory, or directory id is held by another tenant).",
            };
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantEntraDirectoryBound,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = tenant.Id,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { entraTenantId = body.EntraTenantId }),
            },
            cancellationToken).ConfigureAwait(false);

        if (normalizedLocal is null || !hasOid)
            return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.Success };

        bool identityLinked = await _trialIdentityUsers.TryLinkLocalIdentityToEntraAsync(
            normalizedLocal,
            body.EntraOid!.Trim(),
            cancellationToken).ConfigureAwait(false);

        if (!identityLinked)
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.Conflict,
                Message =
                    "Entra directory was bound, but updating the local identity row failed (retry or contact support).",
            };
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TrialLocalIdentityLinkedToEntra,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = tenant.Id,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new { normalizedEmail = normalizedLocal }),
            },
            cancellationToken).ConfigureAwait(false);

        return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.Success };
    }

    /// <inheritdoc />
    public async Task<TenantTrialConvertResult> ConvertTrialAsync(
        TenantTrialConvertBody? body,
        string actor,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return new TenantTrialConvertResult { Outcome = TenantTrialHttpOutcome.TenantNotFound };

        if (!string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
        {
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

        if (!TryMapRequestTier(body?.TargetTier, out TenantTier? tier, out string? tierError))
        {
            return new TenantTrialConvertResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = tierError,
            };
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

    private static TenantTrialStatusDto BuildStatusResponse(TenantRecord tenant, int? daysRemaining) =>
        new()
        {
            Status = string.IsNullOrWhiteSpace(tenant.TrialStatus) ? "None" : tenant.TrialStatus,
            TrialStartUtc = tenant.TrialStartUtc,
            TrialExpiresUtc = tenant.TrialExpiresUtc,
            DaysRemaining = daysRemaining,
            TrialRunsUsed = tenant.TrialRunsUsed,
            TrialRunsLimit = tenant.TrialRunsLimit,
            TrialSeatsUsed = tenant.TrialSeatsUsed,
            TrialSeatsLimit = tenant.TrialSeatsLimit,
            TrialSampleRunId = tenant.TrialSampleRunId,
            TrialWelcomeRunId = tenant.TrialWelcomeRunId,
            FirstCommitUtc = tenant.TrialFirstManifestCommittedUtc,
            TimeToFirstCommittedManifestTotalSeconds = ComputeTimeToFirstCommittedManifestTotalSeconds(tenant),
            BaselineReviewCycleHours = tenant.BaselineReviewCycleHours,
            BaselineReviewCycleSource = tenant.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = tenant.BaselineReviewCycleCapturedUtc,
            IdentityHandoffPending = ComputeIdentityHandoffPending(tenant),
        };

    private static bool ComputeIdentityHandoffPending(TenantRecord tenant) =>
        string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal)
        && tenant.EntraTenantId is null;

    private static double? ComputeTimeToFirstCommittedManifestTotalSeconds(TenantRecord tenant)
    {
        if (tenant.TrialFirstManifestCommittedUtc is not { } committedUtc)
            return null;

        DateTimeOffset anchor = tenant.TrialStartUtc ?? tenant.CreatedUtc;
        return (committedUtc - anchor).TotalSeconds;
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
}
