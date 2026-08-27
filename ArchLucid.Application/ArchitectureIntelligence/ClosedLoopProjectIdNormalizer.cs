namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopProjectIdNormalizer
{
    public static string NormalizeRequired(string projectId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

        return projectId.Trim();
    }

    public static string? NormalizeOptional(string? projectId)
    {
        if (string.IsNullOrWhiteSpace(projectId))
            return null;

        return projectId.Trim();
    }
}
