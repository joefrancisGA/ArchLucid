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

        if (ConfigurationSensitiveConfigPathMatcher.IsSensitiveConfigPath(configPath))
            return "***";

        string? v = configuration[configPath];

        if (string.IsNullOrWhiteSpace(v))
            return null;

        if (ConfigurationSensitiveConfigValueScanner.ContainsEmbeddedCredentialProperties(v))
            return "***";

        const int maxLength = 256;

        if (v.Length <= maxLength)
            return EnsureUtf16WellFormedPrefix(v);

        // Supplementary characters occupy two UTF-16 code units. Cutting on the high
        // surrogate returns an unpaired unit in GET /v1/admin/config-summary.
        int cut = maxLength;

        if (char.IsHighSurrogate(v[cut - 1]))
            cut--;

        return string.Concat(EnsureUtf16WellFormedPrefix(v.AsSpan(0, cut)), "…");
    }

    private static string EnsureUtf16WellFormedPrefix(ReadOnlySpan<char> value)
    {
        if (value.Length == 0)
            return string.Empty;

        int end = value.Length;

        if (char.IsHighSurrogate(value[end - 1]))
            end--;

        if (end > 0 && char.IsLowSurrogate(value[end - 1])
            && (end < 2 || !char.IsHighSurrogate(value[end - 2])))
            end--;

        return value.Slice(0, end).ToString();
    }

    internal static bool IsSensitiveConfigPath(string configPath) =>
        ConfigurationSensitiveConfigPathMatcher.IsSensitiveConfigPath(configPath);
}
