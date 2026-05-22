using ArchLucid.Contracts.Findings;

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

        if (Enum.TryParse(normalized, ignoreCase: true, out FindingSeverity parsed))
            return parsed;

        // Enterprise questionnaires often say "High" where the product enum uses Error.
        if (string.Equals(normalized, "High", StringComparison.OrdinalIgnoreCase))
            return FindingSeverity.Error;

        return null;
    }
}
