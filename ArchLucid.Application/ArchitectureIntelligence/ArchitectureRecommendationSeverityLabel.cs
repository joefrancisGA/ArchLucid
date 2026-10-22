namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Normalizes specialist severity labels before recommendation gating and effort bands.</summary>
internal static class ArchitectureRecommendationSeverityLabel
{
    internal static bool IsCritical(string? severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        return severity.Trim().Equals("Critical", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsCriticalOrHigh(string? severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        string normalized = severity.Trim();

        return normalized.Equals("Critical", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("High", StringComparison.OrdinalIgnoreCase);
    }
}
