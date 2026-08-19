namespace ArchLucid.Cli.Commands;

internal static class ArtifactOutputPathHelper
{
    // Ledger paths may use Windows separators when the gate runs on Linux CI.
    private static readonly char[] CrossPlatformPathSeparators = ['/', '\\'];

    internal static string GetTrailingPathSegment(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        string trimmed = path.Trim().TrimEnd(CrossPlatformPathSeparators);
        string normalized = trimmed.Replace('\\', Path.DirectorySeparatorChar);

        return Path.GetFileName(normalized);
    }

    internal static string GetFileNameWithoutExtensionFromPath(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        string trimmed = path.Trim().TrimEnd(CrossPlatformPathSeparators);
        string normalized = trimmed.Replace('\\', Path.DirectorySeparatorChar);

        return Path.GetFileNameWithoutExtension(normalized);
    }
}
