namespace ArchLucid.Core.Configuration;

/// <summary>Anti-farm limits for self-service trial and workspace creation.</summary>
public sealed class SelfServiceAbuseOptions
{
    public const string SectionPath = "Auth:SelfServiceAbuse";

    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Maximum self-service trial claims per normalized email (invitation bypasses).</summary>
    public int MaxTrialsPerEmailLifetime
    {
        get;
        set;
    } = 1;

    /// <summary>Maximum distinct self-service trials per email domain per rolling window.</summary>
    public int MaxTrialsPerDomainPerWindow
    {
        get;
        set;
    } = 5;

    /// <summary>Rolling window for domain velocity (hours).</summary>
    public int DomainVelocityWindowHours
    {
        get;
        set;
    } = 24;

    /// <summary>Consumer mail domains get stricter per-IP pairing (comma-separated, lowercased).</summary>
    public string ConsumerEmailDomainsCsv
    {
        get;
        set;
    } = "gmail.com,outlook.com,hotmail.com,live.com,yahoo.com,icloud.com,proton.me,protonmail.com";

    public void Normalize()
    {
        MaxTrialsPerEmailLifetime = Math.Clamp(MaxTrialsPerEmailLifetime, 1, 10);
        MaxTrialsPerDomainPerWindow = Math.Clamp(MaxTrialsPerDomainPerWindow, 1, 100);
        DomainVelocityWindowHours = Math.Clamp(DomainVelocityWindowHours, 1, 168);
    }

    public IReadOnlySet<string> ConsumerEmailDomains =>
        ConsumerEmailDomainsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(static domain => domain.ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
}
