namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>
///     Rejects zip-slip paths before reading Visio package entries (AS-010).
/// </summary>
internal static class VsdxZipEntryPathGuard
{
    internal static bool IsSafeEntryPath(string? entryPath)
    {
        if (string.IsNullOrWhiteSpace(entryPath))
        {
            return false;
        }

        string normalized = entryPath.Replace('\\', '/').Trim();

        if (normalized.StartsWith("/", StringComparison.Ordinal)
            || normalized.Contains("../", StringComparison.Ordinal)
            || normalized.Contains("/..", StringComparison.Ordinal)
            || string.Equals(normalized, "..", StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }
}
