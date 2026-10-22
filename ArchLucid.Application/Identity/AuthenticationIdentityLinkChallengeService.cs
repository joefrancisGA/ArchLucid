using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public interface IAuthenticationIdentityLinkChallengeService
{
    Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class AuthenticationIdentityLinkChallengeService(
    IAuthenticationIdentityRepository identities,
    IAuthenticationIdentityLinkProposalService proposalService,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpEmailNotifier emailNotifier,
    IAuditService auditService,
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkChallengeService
{
    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IAuthenticationIdentityLinkProposalService _proposalService =
        proposalService ?? throw new ArgumentNullException(nameof(proposalService));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpEmailNotifier _emailNotifier =
        emailNotifier ?? throw new ArgumentNullException(nameof(emailNotifier));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken)
    {
        EnsureEmailOtpEnabled();

        if (!IdentityEmailNormalizer.TryNormalize(email, out string normalizedEmail, out string displayEmail))
        {
            throw new ArgumentException("Enter a valid email address.", nameof(email));
        }

        await _proposalService.EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
                userId,
                AuthenticationIdentityLinkingSupport.BuildEmailOtpKey(normalizedEmail),
                normalizedEmail,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        Guid challengeId = Guid.NewGuid();
        string rawCode = EmailOtpCodeGenerator.GenerateNumericCode(_emailOtpOptions.CodeLength);
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, _emailOtpOptions.HashPepper);

        await _challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = normalizedEmail,
                CodeHash = codeHash,
                ExpiresUtc = now.AddMinutes(_emailOtpOptions.CodeLifetimeMinutes)
            },
            cancellationToken).ConfigureAwait(false);

        await _emailNotifier.TrySendSignInCodeAsync(
                displayEmail,
                rawCode,
                _emailOtpOptions.CodeLifetimeMinutes,
                cancellationToken)
            .ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityLinkChallengeRequested,
                actorId,
                new { channel = "email_otp_link", emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail) },
                cancellationToken)
            .ConfigureAwait(false);

        return challengeId;
    }

    public async Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken)
    {
        EnsureEmailOtpEnabled();

        EmailOtpChallengeRecord? challenge =
            await _challenges.GetByIdAsync(challengeId, cancellationToken).ConfigureAwait(false);

        if (challenge is null)
        {
            throw new ArgumentException("Verification challenge was not found.");
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, code, _emailOtpOptions.HashPepper);

        EmailOtpChallengeCompletionOutcome completion = await _challenges.TryCompleteAsync(
            challengeId,
            codeHash,
            now,
            _emailOtpOptions.MaxVerificationAttemptsPerChallenge,
            cancellationToken).ConfigureAwait(false);

        if (completion.Result != EmailOtpChallengeCompletionResult.Completed || completion.Challenge is null)
        {
            await AuthAuditEmitter.LogIdentityEventAsync(
                    _auditService,
                    AuditEventTypes.AuthenticationIdentityLinkFailed,
                    actorId,
                    new { reason = completion.Result.ToString() },
                    cancellationToken)
                .ConfigureAwait(false);

            throw new ArgumentException("The verification code is invalid or expired.");
        }

        IdentityEmailNormalizer.TryNormalize(
            completion.Challenge.NormalizedEmail,
            out string normalizedEmail,
            out string displayEmail);

        ExternalIdentityKey externalKey = AuthenticationIdentityLinkingSupport.BuildEmailOtpKey(normalizedEmail);

        await _proposalService.EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
                userId,
                externalKey,
                normalizedEmail,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        AuthenticationIdentityRecord? existingForUser =
            (await _identities.ListByUserIdAsync(userId, cancellationToken).ConfigureAwait(false))
            .FirstOrDefault(row => row.IsActive && row.ProviderType == externalKey.ProviderType
                && string.Equals(row.Subject, externalKey.Subject, StringComparison.Ordinal));

        if (existingForUser is not null)
        {
            throw new InvalidOperationException("This sign-in method is already linked to your account.");
        }

        return await _proposalService.CreateProposalAsync(
                userId,
                externalKey,
                normalizedEmail,
                displayEmail,
                emailVerified: true,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private void EnsureEmailOtpEnabled()
    {
        if (!_emailOtpOptions.Enabled)
        {
            throw new InvalidOperationException("Email one-time-code linking is not enabled.");
        }
    }
}
