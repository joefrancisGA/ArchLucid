namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopWorkspaceIdNormalizer
{
    public static string NormalizeRequired(string workspaceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workspaceId);

        return workspaceId.Trim();
    }

    public static string? NormalizeOptional(string? workspaceId)
    {
        if (string.IsNullOrWhiteSpace(workspaceId))
            return null;

        return workspaceId.Trim();
    }

    public static string NormalizeForHash(string? workspaceId)
    {
        if (string.IsNullOrWhiteSpace(workspaceId))
            return string.Empty;

        return workspaceId.Trim();
    }
}
