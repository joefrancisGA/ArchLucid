// stryker disable all
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
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

    private async Task<RegistrationResult> MapRegisterValidationExceptionAsync(
        TenantSelfRegistrationRequest request,
        string actorEmail,
        Exception ex,
        CancellationToken cancellationToken)
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

    private async Task<RegistrationResult> MapRegisterDuplicateOrganizationExceptionAsync(
        TenantSelfRegistrationRequest request,
        string actorEmail,
        CancellationToken cancellationToken)
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

    private async Task<RegistrationResult> MapRegisterInternalExceptionAsync(
        TenantSelfRegistrationRequest request,
        string actorEmail,
        Exception ex,
        CancellationToken cancellationToken)
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

        throw ex;
    }
}
