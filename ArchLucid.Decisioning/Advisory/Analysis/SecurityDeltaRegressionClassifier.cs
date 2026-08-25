using ArchLucid.Core.Comparison;

namespace ArchLucid.Decisioning.Advisory.Analysis;

/// <summary>
///     Determines whether a <see cref="SecurityDelta" /> represents a security posture regression between runs.
/// </summary>
internal static class SecurityDeltaRegressionClassifier
{
    internal static bool IsRegression(SecurityDelta delta)
    {
        ArgumentNullException.ThrowIfNull(delta);

        if (string.Equals(delta.BaseStatus, delta.TargetStatus, StringComparison.OrdinalIgnoreCase))
            return false;

        if (delta.TargetStatus is null)
            return delta.BaseStatus is not null;

        if (delta.BaseStatus is null)
            return false;

        int baseRank = RankStatus(delta.BaseStatus);
        int targetRank = RankStatus(delta.TargetStatus);

        return targetRank < baseRank;
    }

    internal static int CountRegressions(IEnumerable<SecurityDelta> deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        return deltas.Count(IsRegression);
    }

    private static int RankStatus(string status)
    {
        string normalized = status.Trim().ToLowerInvariant();

        if (IsNegatedPositiveStatus(normalized))
            return 0;

        if (ContainsAny(normalized, "noncompliant", "non-compliant", "non compliant", "fail", "failed", "off", "disabled", "missing", "gap", "at risk"))
            return 0;

        if (ContainsAny(normalized, "partial", "planned", "in progress", "pending", "stated"))
            return 1;

        if (ContainsAny(normalized, "compliant", "pass", "passed", "on", "enabled", "implemented", "met", "satisfied"))
            return 2;

        return 1;
    }

    private static bool IsNegatedPositiveStatus(string normalized)
    {
        return ContainsAny(
            normalized,
            "not compliant",
            "not_compliant",
            "not enabled",
            "not_enabled",
            "not implemented",
            "not met",
            "not satisfied",
            "not passed",
            "not pass");
    }

    private static bool ContainsAny(string value, params string[] tokens)
    {
        foreach (string token in tokens)

            if (ContainsStatusToken(value, token))
                return true;

        return false;
    }

  private static bool ContainsStatusToken(string value, string token)
    {
        if (string.IsNullOrEmpty(token))
            return false;

        if (token.Contains(' ') || token.Contains('-') || token.Contains('_'))
            return value.Contains(token, StringComparison.Ordinal);

        int searchStart = 0;

        while (searchStart <= value.Length - token.Length)
        {
            int index = value.IndexOf(token, searchStart, StringComparison.Ordinal);

            if (index < 0)
                return false;

            bool leftBoundary = index == 0 || !char.IsLetterOrDigit(value[index - 1]);
            int after = index + token.Length;
            bool rightBoundary = after >= value.Length || !char.IsLetterOrDigit(value[after]);

            if (leftBoundary && rightBoundary)
                return true;

            searchStart = index + 1;
        }

        return false;
    }
}
