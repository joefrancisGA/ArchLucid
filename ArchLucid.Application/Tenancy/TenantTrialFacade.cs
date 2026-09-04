using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref="ITenantTrialFacade" />
public sealed class TenantTrialFacade(
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    ITenantTrialAbuseGuard abuseGuard,
    ITenantTrialIdentityHandoffStage identityHandoffStage,
    ITenantTrialConversionStage conversionStage,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> trialLifecycleSchedulerOptions) : ITenantTrialFacade
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantTrialAbuseGuard _abuseGuard =
        abuseGuard ?? throw new ArgumentNullException(nameof(abuseGuard));

    private readonly ITenantTrialIdentityHandoffStage _identityHandoffStage =
        identityHandoffStage ?? throw new ArgumentNullException(nameof(identityHandoffStage));

    private readonly ITenantTrialConversionStage _conversionStage =
        conversionStage ?? throw new ArgumentNullException(nameof(conversionStage));

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

        if (hasEmail && !TrialLocalEmailValidation.TryValidateLength(body.LocalEmail, out string? localEmailError))
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = localEmailError,
            };
        }

        if (hasOid && !TrialEntraOidValidation.TryValidateLength(body.EntraOid, out string? entraOidError))
        {
            return new TenantTrialLinkEntraResult
            {
                Outcome = TenantTrialHttpOutcome.ValidationFailed,
                Message = entraOidError,
            };
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return new TenantTrialLinkEntraResult { Outcome = TenantTrialHttpOutcome.TenantNotFound };

        TenantTrialIdentityLinkPrecheckResult precheck = await _abuseGuard
            .ValidateIdentityLinkAsync(body, scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        if (precheck.Failure is not null)
            return precheck.Failure;

        return await _identityHandoffStage.LinkEntraAsync(
            body,
            tenant,
            scope,
            actor,
            precheck.NormalizedLocalEmail,
            precheck.HasIdentityPayload,
            cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public Task<TenantTrialConvertResult> ConvertTrialAsync(
        TenantTrialConvertBody? body,
        string actor,
        CancellationToken cancellationToken) =>
        _conversionStage.ConvertTrialAsync(body, actor, cancellationToken);

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
}
