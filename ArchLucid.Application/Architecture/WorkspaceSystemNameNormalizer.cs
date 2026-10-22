namespace ArchLucid.Application.Architecture;

/// <summary>Normalizes review/architecture display names for workspace-wide duplicate checks.</summary>
public static class WorkspaceSystemNameNormalizer
{
    /// <summary>Returns a trimmed, case-insensitive comparison key, or <see langword="null" /> when empty.</summary>
    public static string? NormalizeOrNull(string? systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return null;

        return systemName.Trim().ToUpperInvariant();
    }
}
