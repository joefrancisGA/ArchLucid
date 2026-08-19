using System.Text.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Identity;
using ArchLucid.Application.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Tenancy;

/// <inheritdoc cref = "ITrialTenantBootstrapService"/>
public sealed class TrialTenantBootstrapService(
    IDemoSeedService demoSeedService,
    ITenantRepository tenantRepository,
    IAuditService auditService,
    ITrialBootstrapEmailVerificationPolicy emailVerificationPolicy,
    ISelfServiceTrialAiBudgetPolicyProvisioner trialAiBudgetPolicyProvisioner,
    ILogger<TrialTenantBootstrapService> logger) : ITrialTenantBootstrapService
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IDemoSeedService _demoSeedService = demoSeedService ?? throw new ArgumentNullException(nameof(demoSeedService));

    private readonly ITrialBootstrapEmailVerificationPolicy _emailVerificationPolicy =
        emailVerificationPolicy ?? throw new ArgumentNullException(nameof(emailVerificationPolicy));

    private readonly ISelfServiceTrialAiBudgetPolicyProvisioner _trialAiBudgetPolicyProvisioner =
        trialAiBudgetPolicyProvisioner ?? throw new ArgumentNullException(nameof(trialAiBudgetPolicyProvisioner));

    private readonly ILogger<TrialTenantBootstrapService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <inheritdoc/>
    public async Task TryBootstrapAfterSelfRegistrationAsync(TenantProvisioningResult result, string auditActorEmail,
        TrialSignupBaselineReviewCycleCapture? baselineReviewCycle, TrialSignupCompanyProfileCapture? companyProfile, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditActorEmail);
        ArgumentNullException.ThrowIfNull(result);

        if (string.IsNullOrWhiteSpace(auditActorEmail))
            throw new ArgumentException("Audit actor email is required.", nameof(auditActorEmail));

        if (result.WasAlreadyProvisioned)
            return;

        ScopeContext scope = new()
        {
            TenantId = result.TenantId,
            WorkspaceId = result.DefaultWorkspaceId,
            ProjectId = result.DefaultProjectId
        };

        using (AmbientScopeContext.Push(scope))
        {
            if (baselineReviewCycle is not null)
                await _tenantRepository.PersistTrialSignupBaselineReviewCycleAsync(
                    result.TenantId,
                    baselineReviewCycle.Hours,
                    baselineReviewCycle.SourceNote,
                    baselineReviewCycle.CapturedUtc,
                    cancellationToken);

            if (!await _emailVerificationPolicy.CanProvisionTrialForRegisteredEmailAsync(auditActorEmail, cancellationToken))
            {
                if (_logger.IsEnabled(LogLevel.Information))
                {
                    SanitizedLoggerTrialBootstrapExtensions.LogInformationTrialBootstrapEmailVerificationBlocked(
                        _logger,
                        result.TenantId,
                        auditActorEmail);
                }
                ArchLucidInstrumentation.RecordTrialSignupFailure("email_verification", "policy_blocked");
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.TrialSignupFailed,
                        ActorUserId = auditActorEmail.Trim(),
                        ActorUserName = auditActorEmail.Trim(),
                        TenantId = result.TenantId,
                        WorkspaceId = result.DefaultWorkspaceId,
                        ProjectId = result.DefaultProjectId,
                        DataJson = JsonSerializer.Serialize(new { stage = "email_verification", reason = "policy_blocked" })
                    },
                    cancellationToken);

                return;
            }

            ContosoRetailDemoIds demoIds = ContosoRetailDemoIds.ForTenant(result.TenantId);
            Guid sampleRunId = ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(result.TenantId);
            bool fullDemoSeedSucceeded = false;

            try
            {
                await _demoSeedService.SeedTrialWelcomeRunAsync(cancellationToken);

                try
                {
                    await _demoSeedService.SeedAsync(cancellationToken);
                    fullDemoSeedSucceeded = true;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(
                            ex,
                            "Full demo seed failed for tenant {TenantId}; activating trial with welcome sample run only.",
                            result.TenantId);
                }
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        ex,
                        "Trial welcome seed failed for tenant {TenantId}; activating trial with deterministic sample run id.",
                        result.TenantId);
            }

            if (fullDemoSeedSucceeded)
                sampleRunId = demoIds.AuthorityRunBaselineId;

            try
            {
                DateTimeOffset start = TimeProvider.System.GetUtcNow();
                DateTimeOffset expires = start.AddDays(14);
                await _tenantRepository.CommitSelfServiceTrialAsync(
                    result.TenantId,
                    start,
                    expires,
                    10,
                    3,
                    sampleRunId,
                    baselineReviewCycle?.Hours,
                    baselineReviewCycle?.SourceNote,
                    baselineReviewCycle?.CapturedUtc,
                    companyProfile?.CompanySize,
                    companyProfile?.ArchitectureTeamSize,
                    companyProfile?.IndustryVertical,
                    companyProfile?.IndustryVerticalOther,
                    cancellationToken);

                // The registering admin occupies the first trial seat immediately — otherwise TrialSeatsUsed
                // stays 0 until their first authenticated request reaches TrialSeatReservationMiddleware.
                await _tenantRepository.TryClaimTrialSeatAsync(result.TenantId, auditActorEmail.Trim(), cancellationToken);

                await _trialAiBudgetPolicyProvisioner.EnsureDefaultTrialPolicyIfAbsentAsync(
                    result.TenantId,
                    expires,
                    cancellationToken);

                string actor = auditActorEmail.Trim();
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.TrialProvisioned,
                        ActorUserId = actor,
                        ActorUserName = actor,
                        TenantId = result.TenantId,
                        WorkspaceId = result.DefaultWorkspaceId,
                        ProjectId = result.DefaultProjectId,
                        DataJson = JsonSerializer.Serialize(
                            new { trialExpiresUtc = expires, sampleRunId })
                    },
                    cancellationToken);
                await _tenantRepository.EnqueueTrialArchitecturePreseedAsync(result.TenantId, cancellationToken);
                ArchLucidInstrumentation.RecordTrialSignup("self_service", "trial_provisioned");
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Error))
                    _logger.LogError(
                        ex,
                        "Trial bootstrap failed for tenant {TenantId}; tenant row exists without trial metadata.",
                        result.TenantId);
                ArchLucidInstrumentation.RecordTrialSignupFailure("trial_bootstrap", ex.GetType().Name);
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.TrialSignupFailed,
                        ActorUserId = auditActorEmail.Trim(),
                        ActorUserName = auditActorEmail.Trim(),
                        TenantId = result.TenantId,
                        WorkspaceId = result.DefaultWorkspaceId,
                        ProjectId = result.DefaultProjectId,
                        DataJson = JsonSerializer.Serialize(new { stage = "trial_bootstrap", reason = ex.GetType().Name })
                    },
                    cancellationToken);
            }
        }
    }

    /// <inheritdoc/>
    public async Task TryBootstrapAfterPostAuthWorkspaceAsync(
        TenantProvisioningResult result,
        string auditActorEmail,
        TrialSignupCompanyProfileCapture? companyProfile,
        bool includeDemoSeed,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentException.ThrowIfNullOrWhiteSpace(auditActorEmail);
        _ = companyProfile;

        if (result.WasAlreadyProvisioned || !includeDemoSeed)
        {
            return;
        }

        ScopeContext scope = new()
        {
            TenantId = result.TenantId,
            WorkspaceId = result.DefaultWorkspaceId,
            ProjectId = result.DefaultProjectId
        };

        using (AmbientScopeContext.Push(scope))
        {
            try
            {
                await _demoSeedService.SeedTrialWelcomeRunAsync(cancellationToken).ConfigureAwait(false);

                try
                {
                    await _demoSeedService.SeedAsync(cancellationToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                    {
                        _logger.LogWarning(
                            ex,
                            "Post-auth demo seed failed for tenant {TenantId}; welcome run may still be available.",
                            result.TenantId);
                    }
                }
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Post-auth workspace bootstrap failed for tenant {TenantId}.",
                        result.TenantId);
                }
            }
        }
    }
}
