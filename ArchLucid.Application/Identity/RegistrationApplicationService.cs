using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Default <see cref="IRegistrationApplicationService"/> consolidating public registration orchestration
///     previously in <c>RegistrationController</c>.
/// </summary>
public sealed class RegistrationApplicationService(
    ITenantProvisioningService provisioning,
    ITenantRepository tenants,
    IAuditService audit,
    ITrialTenantBootstrapService trialBootstrap,
    ISelfServiceTrialAbusePolicy abusePolicy,
    IOptions<PublicSignupOptions> publicSignupOptions,
    TimeProvider timeProvider) : IRegistrationApplicationService
{
    private const string InviteOnlyMessage =
        "Registration is by invitation. Request access to join an evaluation workspace.";

    private const string FriendlyValidation =
        "The registration could not be completed. Check the organization name, email, and optional review-cycle fields, then try again.";

    private const string FriendlyInternal =
        "We could not complete your registration. Please try again in a few minutes. If the problem continues, share the correlationId field on this error response (or the X-Correlation-ID response header) with your administrator.";

    private const string DuplicateOrganizationMessage =
        "An organization with this name is already registered.";

    private readonly IAuditService _audit = audit ?? throw new ArgumentNullException(nameof(audit));

    private readonly ITenantProvisioningService _provisioning =
        provisioning ?? throw new ArgumentNullException(nameof(provisioning));

    private readonly ITenantRepository _tenants =
        tenants ?? throw new ArgumentNullException(nameof(tenants));

    private readonly ITrialTenantBootstrapService _trialBootstrap =
        trialBootstrap ?? throw new ArgumentNullException(nameof(trialBootstrap));

    private readonly ISelfServiceTrialAbusePolicy _abusePolicy =
        abusePolicy ?? throw new ArgumentNullException(nameof(abusePolicy));

    private readonly PublicSignupOptions _publicSignupOptions =
        publicSignupOptions?.Value ?? throw new ArgumentNullException(nameof(publicSignupOptions));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<RegistrationResult> RegisterAsync(
        TenantSelfRegistrationRequest? request,
        CancellationToken cancellationToken)
    {
        if (_publicSignupOptions.IsInviteOnly())
        {
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

            return RegistrationResult.InviteOnly(InviteOnlyMessage);
        }

        if (request is null)
        {
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

            await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
                _audit,
                "anonymous@request",
                "anonymous",
                new
                {
                    reason = "validation",
                    code = "body_required",
                    message = (string?)"Request body is required."
                },
                cancellationToken);

            return RegistrationResult.BodyRequired("Request body is required.");
        }

        RegistrationBaselineValidation baseline = RegistrationRequestBaselineValidator.Validate(request);

        if (!baseline.IsValid)
        {
            return await RegisterFailureValidationAsync(
                request,
                "validation",
                baseline.LogMessage!,
                baseline.Code!,
                baseline.UserMessage!,
                cancellationToken);
        }

        string actorEmail = request.AdminEmail.Trim();

        if (!IdentityEmailNormalizer.TryNormalize(actorEmail, out string normalizedAdminEmail, out _))
        {
            return await RegisterFailureValidationAsync(
                request,
                "validation",
                "Admin email is invalid.",
                "invalid_email",
                FriendlyValidation,
                cancellationToken);
        }

        SelfServiceTrialAbuseEvaluation abuseEvaluation = await _abusePolicy.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest
            {
                NormalizedEmail = normalizedAdminEmail,
                ClientIp = request.ClientIp
            },
            cancellationToken).ConfigureAwait(false);

        if (!abuseEvaluation.Allowed)
        {
            ArchLucidInstrumentation.RecordSelfServiceTrialAbuseDenied(abuseEvaluation.DenyReasonCode);
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

            await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
                _audit,
                actorEmail,
                actorEmail,
                new { reason = abuseEvaluation.DenyReasonCode },
                cancellationToken);

            return RegistrationResult.ValidationFailed(abuseEvaluation.CustomerMessage);
        }

        await RegistrationAuditEmitter.LogTrialSignupAttemptedAsync(
            _audit,
            actorEmail,
            RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
            cancellationToken);

        if (await TryResolveExistingOrganizationAsync(request.OrganizationName, cancellationToken).ConfigureAwait(false)
            is not null)
        {
            return await RegisterOrganizationConflictAsync(request, actorEmail, cancellationToken).ConfigureAwait(false);
        }

        try
        {
            TenantProvisioningResult result = await _provisioning.ProvisionAsync(
                new TenantProvisioningRequest
                {
                    Name = request.OrganizationName.Trim(),
                    AdminEmail = request.AdminEmail.Trim(),
                    Tier = TenantTier.Free,
                    FirstTouch = request.FirstTouch,
                    AuditActorOverride = request.AdminEmail.Trim()
                },
                cancellationToken);

            if (result.WasAlreadyProvisioned)
            {
                return await RegisterOrganizationConflictAsync(request, actorEmail, cancellationToken)
                    .ConfigureAwait(false);
            }

            string actor = request.AdminEmail.Trim();
            string actorName = RegistrationAuditEmitter.ResolveActorDisplayName(actor, request.AdminDisplayName);

            await RegistrationAuditEmitter.LogTenantSelfRegisteredAsync(
                _audit,
                actor,
                actorName,
                result.TenantId,
                result.DefaultWorkspaceId,
                result.DefaultProjectId,
                new
                {
                    organizationName = request.OrganizationName.Trim(),
                    adminEmail = request.AdminEmail.Trim(),
                    companySize = request.CompanySize,
                    architectureTeamSize = request.ArchitectureTeamSize,
                    industryVertical = request.IndustryVertical,
                    industryVerticalOther = string.Equals(
                        request.IndustryVertical,
                        "Other",
                        StringComparison.Ordinal)
                        ? request.IndustryVerticalOther?.Trim()
                        : null
                },
                cancellationToken);

            TrialSignupBaselineReviewCycleCapture? baselineCapture = request.BaselineReviewCycleHours is { } h
                ? new TrialSignupBaselineReviewCycleCapture(h, baseline.NormalizedSource, _timeProvider.GetUtcNow())
                : null;

            bool hasCompanyProfile = request.CompanySize is not null
                                     || request.ArchitectureTeamSize is not null
                                     || !string.IsNullOrWhiteSpace(request.IndustryVertical);

            TrialSignupCompanyProfileCapture? companyProfile = hasCompanyProfile
                ? new TrialSignupCompanyProfileCapture(
                    request.CompanySize,
                    request.ArchitectureTeamSize,
                    request.IndustryVertical,
                    string.Equals(request.IndustryVertical, "Other", StringComparison.Ordinal)
                        ? request.IndustryVerticalOther?.Trim()
                        : null)
                : null;

            await _trialBootstrap.TryBootstrapAfterSelfRegistrationAsync(
                result,
                actor,
                baselineCapture,
                companyProfile,
                cancellationToken);

            if (baselineCapture is not null)
            {
                await RegistrationAuditEmitter.LogTrialBaselineReviewCycleCapturedAsync(
                    _audit,
                    actor,
                    actorName,
                    result.TenantId,
                    new
                    {
                        baselineReviewCycleHours = baselineCapture.Hours,
                        baselineReviewCycleSource = baseline.NormalizedSource,
                        capturedUtc = baselineCapture.CapturedUtc,
                        companySize = companyProfile?.CompanySize,
                        architectureTeamSize = companyProfile?.ArchitectureTeamSize,
                        industryVertical = companyProfile?.IndustryVertical,
                        industryVerticalOther = companyProfile?.IndustryVerticalOther
                    },
                    cancellationToken);
            }
            else
                ArchLucidInstrumentation.RecordTrialSignupBaselineSkipped();

            await _abusePolicy.RecordSuccessfulClaimAsync(
                normalizedAdminEmail,
                platformUserId: null,
                result.TenantId,
                "api_register",
                cancellationToken).ConfigureAwait(false);

            ArchLucidInstrumentation.RecordOperatorTaskSuccess("first_session_completed");

            return RegistrationResult.Created(result);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            ArchLucidInstrumentation.RecordTrialSignupFailure("validation", ex.GetType().Name);
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

            await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
                _audit,
                actorEmail,
                RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
                new
                {
                    reason = "validation",
                    code = "exception",
                    type = ex.GetType().Name,
                    message = ex.Message
                },
                cancellationToken);

            return RegistrationResult.ValidationFailed(FriendlyValidation);
        }
        catch (Exception ex) when (TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex))
        {
            ArchLucidInstrumentation.RecordTrialSignupFailure("provision", "duplicate_organization");
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("conflict");

            await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
                _audit,
                actorEmail,
                RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
                new { reason = "conflict", code = "duplicate_organization" },
                cancellationToken);

            return RegistrationResult.Conflict(DuplicateOrganizationMessage);
        }
        catch (Exception ex)
        {
            ArchLucidInstrumentation.RecordTrialSignupFailure("server", ex.GetType().Name);
            ArchLucidInstrumentation.RecordTrialRegistrationFailure("internal");

            await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
                _audit,
                actorEmail,
                RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
                new { reason = "internal", type = ex.GetType().Name, message = ex.Message },
                cancellationToken);

            if (ex is not OperationCanceledException)
                return RegistrationResult.InternalError(FriendlyInternal);

            throw;
        }
    }

    private async Task<RegistrationResult> RegisterFailureValidationAsync(
        TenantSelfRegistrationRequest request,
        string reasonLabel,
        string logMessage,
        string code,
        string userMessage,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

        string actor = string.IsNullOrWhiteSpace(request.AdminEmail) ? "anonymous@request" : request.AdminEmail.Trim();
        string name = RegistrationAuditEmitter.ResolveActorDisplayName(actor, request.AdminDisplayName);

        await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
            _audit,
            actor,
            name,
            new { reason = reasonLabel, code, message = logMessage },
            cancellationToken);

        return RegistrationResult.ValidationFailed(userMessage);
    }

    private async Task<TenantRecord?> TryResolveExistingOrganizationAsync(
        string organizationName,
        CancellationToken cancellationToken)
    {
        string trimmed = organizationName.Trim();
        string normalizedOrganizationName = TenantOrganizationDuplicateDetector.NormalizeOrganizationName(trimmed);
        string slug = TenantSlugNormalizer.FromName(trimmed);
        ScopeContext unscoped = new();

        using (AmbientScopeContext.Push(unscoped))
        {
            TenantRecord? existing =
                await _tenants.GetBySlugFromControlPlaneCatalogAsync(slug, cancellationToken).ConfigureAwait(false);

            if (existing is not null)
                return existing;

            existing = await _tenants
                .GetByNormalizedOrganizationNameAsync(normalizedOrganizationName, cancellationToken)
                .ConfigureAwait(false);

            if (existing is not null)
                return existing;

            // GetBySlugAsync fans out through tenant-directory routing; last resort when catalog
            // and normalized-name probes miss (SystemWithPerTenantCatalogs + greenfield CI catalog pinning).
            return await _tenants.GetBySlugAsync(slug, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task<RegistrationResult> RegisterOrganizationConflictAsync(
        TenantSelfRegistrationRequest request,
        string actorEmail,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordTrialSignupFailure("provision", "duplicate_slug");
        ArchLucidInstrumentation.RecordTrialRegistrationFailure("conflict");

        await RegistrationAuditEmitter.LogTrialRegistrationFailedAsync(
            _audit,
            actorEmail,
            RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
            new { reason = "conflict", code = "duplicate_slug" },
            cancellationToken);

        return RegistrationResult.Conflict(DuplicateOrganizationMessage);
    }
}
