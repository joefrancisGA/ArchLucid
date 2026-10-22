namespace ArchLucid.Core.Configuration;

/// <summary>Passwordless email one-time-code sign-in.</summary>
public sealed class EmailOtpAuthOptions
{
    public const string SectionPath = "Auth:EmailOtp";

    public bool Enabled
    {
        get;
        set;
    }

    public int CodeLength
    {
        get;
        set;
    } = 6;

    public int CodeLifetimeMinutes
    {
        get;
        set;
    } = 10;

    public int MaxVerificationAttemptsPerChallenge
    {
        get;
        set;
    } = 5;

    public int MaxCodeRequestsPerEmailPerHour
    {
        get;
        set;
    } = 5;

    public int MaxCodeRequestsPerIpPerHour
    {
        get;
        set;
    } = 20;

    public int MaxVerificationAttemptsPerEmailPerHour
    {
        get;
        set;
    } = 15;

    public int ResendCooldownSeconds
    {
        get;
        set;
    } = 45;

    public int AccessTokenLifetimeMinutes
    {
        get;
        set;
    } = 60;

    public bool RequireBotChallenge
    {
        get;
        set;
    }

    public EmailOtpBotChallengeOptions BotChallenge
    {
        get;
        set;
    } = new();

    /// <summary>Optional pepper mixed into OTP code hashes (configure via secret store in production).</summary>
    public string HashPepper
    {
        get;
        set;
    } = string.Empty;

    public void Normalize()
    {
        CodeLength = Math.Clamp(CodeLength, 4, 10);
        CodeLifetimeMinutes = Math.Clamp(CodeLifetimeMinutes, 3, 60);
        MaxVerificationAttemptsPerChallenge = Math.Clamp(MaxVerificationAttemptsPerChallenge, 3, 20);
        MaxCodeRequestsPerEmailPerHour = Math.Clamp(MaxCodeRequestsPerEmailPerHour, 1, 30);
        MaxCodeRequestsPerIpPerHour = Math.Clamp(MaxCodeRequestsPerIpPerHour, 1, 200);
        MaxVerificationAttemptsPerEmailPerHour = Math.Clamp(MaxVerificationAttemptsPerEmailPerHour, 5, 100);
        ResendCooldownSeconds = Math.Clamp(ResendCooldownSeconds, 15, 300);
        AccessTokenLifetimeMinutes = Math.Clamp(AccessTokenLifetimeMinutes, 5, 24 * 60);
        BotChallenge.Normalize();
    }
}
