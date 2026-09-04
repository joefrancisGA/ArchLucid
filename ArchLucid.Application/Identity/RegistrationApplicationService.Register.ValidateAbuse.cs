// stryker disable all
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
    private RegistrationResult? TryRejectInviteOnly()
    {
        if (!_publicSignupOptions.IsInviteOnly())
            return null;

        ArchLucidInstrumentation.RecordTrialRegistrationFailure("validation");

        return RegistrationResult.InviteOnly(InviteOnlyMessage);
    }

    private async Task<RegistrationResult?> TryRejectInvalidRequestAsync(
        TenantSelfRegistrationRequest? request,
        CancellationToken cancellationToken)
    {
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

        return null;
    }

    private async Task<RegistrationAbuseGateResult> EvaluateRegistrationAbuseGateAsync(
        TenantSelfRegistrationRequest request,
        RegistrationBaselineValidation baseline,
        CancellationToken cancellationToken)
    {
        string actorEmail = request.AdminEmail.Trim();

        if (!IdentityEmailNormalizer.TryNormalize(actorEmail, out string normalizedAdminEmail, out _))
        {
            RegistrationResult failure = await RegisterFailureValidationAsync(
                request,
                "validation",
                "Admin email is invalid.",
                "invalid_email",
                FriendlyValidation,
                cancellationToken);

            return new RegistrationAbuseGateResult(failure, actorEmail, normalizedAdminEmail, baseline);
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

            return new RegistrationAbuseGateResult(
                RegistrationResult.ValidationFailed(abuseEvaluation.CustomerMessage),
                actorEmail,
                normalizedAdminEmail,
                baseline);
        }

        await RegistrationAuditEmitter.LogTrialSignupAttemptedAsync(
            _audit,
            actorEmail,
            RegistrationAuditEmitter.ResolveActorDisplayName(actorEmail, request.AdminDisplayName),
            cancellationToken);

        return new RegistrationAbuseGateResult(null, actorEmail, normalizedAdminEmail, baseline);
    }
}
