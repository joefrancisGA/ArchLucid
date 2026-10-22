namespace ArchLucid.Core.Configuration;

/// <summary>Server-side bot challenge verification for email OTP challenge requests.</summary>
public sealed class EmailOtpBotChallengeOptions
{
    public EmailOtpBotChallengeProvider Provider
    {
        get;
        set;
    }

    /// <summary>Provider secret key (Key Vault / env only — never commit).</summary>
    public string SecretKey
    {
        get;
        set;
    } = string.Empty;

    public void Normalize()
    {
        SecretKey = SecretKey?.Trim() ?? string.Empty;
    }
}
