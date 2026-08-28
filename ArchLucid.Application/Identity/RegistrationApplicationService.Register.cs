using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
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
