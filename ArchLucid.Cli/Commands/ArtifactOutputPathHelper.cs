namespace ArchLucid.Cli.Commands;

internal static class ArtifactOutputPathHelper
{
    internal static string GetTrailingPathSegment(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        string trimmed = path.Trim().TrimEnd(
            Path.DirectorySeparatorChar,
            Path.AltDirectorySeparatorChar);

        // Ledger paths may use Windows separators when the gate runs on Linux CI.
        string normalized = trimmed.Replace('\\', Path.DirectorySeparatorChar);

        return Path.GetFileName(normalized);
    }

    internal static string GetFileNameWithoutExtensionFromPath(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        string trimmed = path.Trim();
        string normalized = trimmed.Replace('\\', Path.DirectorySeparatorChar);

        return Path.GetFileNameWithoutExtension(normalized);
    }
}
