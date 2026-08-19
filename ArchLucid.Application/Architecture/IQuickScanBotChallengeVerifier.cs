namespace ArchLucid.Application.Architecture;

/// <summary>Verifies bot-challenge tokens for anonymous Quick Scan CAPTCHA friction (TB-897).</summary>
public interface IQuickScanBotChallengeVerifier
{
    /// <summary>
    ///     Returns true only when the token is verified with the configured Turnstile secret.
    ///     Never short-circuits on email-OTP <c>RequireBotChallenge</c> — fail closed when secret/token is missing.
    /// </summary>
    Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken = default);
}
