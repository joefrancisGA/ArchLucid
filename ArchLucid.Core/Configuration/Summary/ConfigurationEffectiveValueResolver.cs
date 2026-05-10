using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Resolves operator-safe configuration display values (secrets redacted).
/// </summary>
public static class ConfigurationEffectiveValueResolver
{
    /// <summary>Returns <c>null</c> when unset; <c>***</c> when sensitive; otherwise truncated scalar text.</summary>
    public static string? Resolve(IConfiguration configuration, string configPath, bool isSet)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(configPath) || !isSet)
            return null;

        if (IsSensitiveConfigPath(configPath))
            return "***";

        string? v = configuration[configPath];

        if (string.IsNullOrWhiteSpace(v))
            return null;

        const int maxLength = 256;

        return v.Length <= maxLength ? v : string.Concat(v.AsSpan(0, maxLength), "…");
    }

    internal static bool IsSensitiveConfigPath(string configPath)
    {
        ReadOnlySpan<char> p = configPath.AsSpan();

        return p.Contains("ConnectionString", StringComparison.OrdinalIgnoreCase)
               || p.Contains("Password", StringComparison.OrdinalIgnoreCase)
               || p.Contains("Secret", StringComparison.OrdinalIgnoreCase)
               || p.Contains("Token", StringComparison.OrdinalIgnoreCase)
               || p.Contains("ApiKey", StringComparison.OrdinalIgnoreCase)
               || p.EndsWith(":Key", StringComparison.OrdinalIgnoreCase);
    }
}
