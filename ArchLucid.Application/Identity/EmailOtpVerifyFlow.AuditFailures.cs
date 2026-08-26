using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Application.Identity;

public sealed partial class EmailOtpVerifyFlow
{
    private Task<EmailOtpVerifyResult> FailWithAuditAsync(
        string reason,
        string? emailCorrelation,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordEmailOtpChallengeVerified(
            AuthValidationResultMapper.MapEmailOtpVerifyMetricResult(reason));

        if (!string.IsNullOrWhiteSpace(emailCorrelation))
        {
            return FailWithAuditCoreAsync(reason, emailCorrelation, cancellationToken);
        }

        return Task.FromResult(AuthValidationResultMapper.ToEmailOtpVerifyFailure());
    }

    private async Task<EmailOtpVerifyResult> FailWithAuditCoreAsync(
        string reason,
        string emailCorrelation,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.EmailOtpVerificationFailed,
                emailCorrelation,
                new { emailCorrelation, reason },
                cancellationToken)
            .ConfigureAwait(false);

        return AuthValidationResultMapper.ToEmailOtpVerifyFailure();
    }
}
