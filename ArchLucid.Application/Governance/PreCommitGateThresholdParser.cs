using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance;

/// <summary>Parses <see cref="PreCommitGovernanceGateOptions.PreCommitGateThreshold"/> into <see cref="FindingSeverity"/>.</summary>
public static class PreCommitGateThresholdParser
{
    /// <summary>Maps configured threshold text to minimum blocking severity; null when unset or invalid.</summary>
    public static FindingSeverity? TryParseMinimumSeverity(string? thresholdText)
    {
        if (string.IsNullOrWhiteSpace(thresholdText))
            return null;

        string normalized = thresholdText.Trim();

        if (Enum.TryParse(normalized, ignoreCase: true, out FindingSeverity parsed)
            && Enum.IsDefined(parsed))
            return parsed;

        // Enterprise questionnaires often say "High" where the product enum uses Error.
        if (string.Equals(normalized, "High", StringComparison.OrdinalIgnoreCase))
            return FindingSeverity.Error;

        return null;
    }

    /// <summary>Maps a persisted or request-supplied severity ordinal to a defined <see cref="FindingSeverity"/>; null when out of range.</summary>
    public static int? TryCoerceDefinedSeverityOrdinal(int? ordinal)
    {
        if (!ordinal.HasValue)
            return null;

        FindingSeverity severity = (FindingSeverity)ordinal.Value;
        return Enum.IsDefined(severity) ? ordinal : null;
    }

    /// <summary>Reads pack metadata severity keys through <see cref="TryParseMinimumSeverity"/> (same rules as global pre-commit threshold config).</summary>
    public static int? TryParseMinimumSeverityOrdinalFromMetadata(IReadOnlyDictionary<string, string> metadata, string[] keys)
    {
        ArgumentNullException.ThrowIfNull(metadata);
        ArgumentNullException.ThrowIfNull(keys);

        foreach (string key in keys)
        {
            if (!PolicyPackContentMetadataReader.TryGetValue(metadata, key, out string? raw) || string.IsNullOrWhiteSpace(raw))
                continue;

            FindingSeverity? parsed = TryParseMinimumSeverity(raw);
            if (parsed.HasValue)
                return (int)parsed.Value;
        }

        return null;
    }
}
