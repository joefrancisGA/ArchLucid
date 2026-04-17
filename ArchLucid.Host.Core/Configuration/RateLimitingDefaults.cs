namespace ArchLucid.Host.Core.Configuration;

/// <summary>Product defaults for rate limiting when configuration keys are absent.</summary>
public static class RateLimitingDefaults
{
    /// <summary>Default requests per <c>RateLimiting:FixedWindow:WindowMinutes</c> for the <c>fixed</c> policy.</summary>
    public const int FixedWindowPermitLimit = 60;
}
