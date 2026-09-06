using ArchLucid.Core.Security;

namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Detects configuration path segments that should be redacted in operator summaries.
/// </summary>
internal static class ConfigurationSensitiveConfigPathMatcher
{
    public static bool IsSensitiveConfigPath(string configPath)
    {
        if (string.IsNullOrWhiteSpace(configPath))
        {
            return false;
        }

        foreach (string segment in configPath.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (IsSensitiveConfigSegment(segment))
            {
                return true;
            }
        }

        return configPath.EndsWith(":Key", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSensitiveConfigSegment(string segment)
    {
        if (segment.Equals("Key", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return SensitiveCredentialNameMatcher.IsSensitiveCredentialName(segment);
    }
}
