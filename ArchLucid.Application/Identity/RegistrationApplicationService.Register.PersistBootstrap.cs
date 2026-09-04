// stryker disable all
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
    private async Task<RegistrationResult> PersistBootstrapRegistrationAsync(
        TenantSelfRegistrationRequest request,
        string actorEmail,
        string normalizedAdminEmail,
        RegistrationBaselineValidation baseline,
        CancellationToken cancellationToken)
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
}
