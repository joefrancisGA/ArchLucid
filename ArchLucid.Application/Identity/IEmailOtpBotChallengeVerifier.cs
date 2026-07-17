namespace ArchLucid.Application.Identity;

/// <summary>Optional bot challenge verification for email OTP challenge requests (adapter at host edge).</summary>
public interface IEmailOtpBotChallengeVerifier
{
    /// <summary>Returns true when the token satisfies the configured bot challenge policy.</summary>
    Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken);
}
