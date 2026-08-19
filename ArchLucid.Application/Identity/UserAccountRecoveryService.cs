using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public sealed class UserAccountPrimaryEmailChangeRequest
{
    public Guid ChallengeId
    {
        get;
        init;
    }

    public string Code
    {
        get;
        init;
    } = string.Empty;
}

public interface IUserAccountRecoveryService
{
    Task ChangePrimaryEmailAsync(
        Guid userId,
        UserAccountPrimaryEmailChangeRequest request,
        string actorId,
        CancellationToken cancellationToken);
}

/// <summary>
/// User recovery without passwords: email-code possession, secondary sign-in linking, and guarded primary-email changes.
/// </summary>
public sealed class UserAccountRecoveryService(
    IPlatformUserRepository users,
    IEmailOtpChallengeRepository challenges,
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    IAuditService auditService,
    TimeProvider timeProvider) : IUserAccountRecoveryService
{
    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task ChangePrimaryEmailAsync(
        Guid userId,
        UserAccountPrimaryEmailChangeRequest request,
        string actorId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        PlatformUserRecord? user = await _users.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false)
            ?? throw new PlatformUserNotFoundException(userId);

        EmailOtpChallengeRecord? challenge =
            await _challenges.GetByIdAsync(request.ChallengeId, cancellationToken).ConfigureAwait(false)
            ?? throw new ArgumentException("Verification challenge was not found.");

        DateTimeOffset now = _timeProvider.GetUtcNow();
        string codeHash = EmailOtpCodeHasher.Hash(request.ChallengeId, request.Code, _emailOtpOptions.HashPepper);

        EmailOtpChallengeCompletionOutcome completion = await _challenges.TryCompleteAsync(
            request.ChallengeId,
            codeHash,
            now,
            _emailOtpOptions.MaxVerificationAttemptsPerChallenge,
            cancellationToken).ConfigureAwait(false);

        if (completion.Result != EmailOtpChallengeCompletionResult.Completed || completion.Challenge is null)
        {
            throw new ArgumentException("Invalid or expired verification code.");
        }

        string normalizedEmail = completion.Challenge.NormalizedEmail;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.UserAccountPrimaryEmailChangeRequested,
                ActorUserId = actorId,
                ActorUserName = actorId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        userId,
                        emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail)
                    })
            },
            cancellationToken).ConfigureAwait(false);

        if (string.Equals(user.NormalizedPrimaryEmail, normalizedEmail, StringComparison.Ordinal))
        {
            return;
        }

        await _users.UpdatePrimaryEmailAsync(
                userId,
                normalizedEmail,
                normalizedEmail,
                now,
                cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.UserAccountPrimaryEmailChanged,
                ActorUserId = actorId,
                ActorUserName = actorId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        userId,
                        emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail)
                    })
            },
            cancellationToken).ConfigureAwait(false);
    }
}
