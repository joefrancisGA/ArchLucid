namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>
///     Produces file names safe for archives and for common client OSes.
///     <see cref="Path.GetInvalidFileNameChars" /> is OS-specific (e.g. <c>|</c> and <c>?</c> are valid on Linux but
///     invalid on Windows), so we union platform invalid chars with a Windows-style denylist for exports.
/// </summary>
public static class FileNameSanitizer
{
    internal const string MissingFileNameEntry = "Artifact file name was not stored.txt";

    internal const string EmptyFileNameEntry = "Artifact file name was stored empty.txt";

    private static readonly HashSet<char> InvalidChars = CreateInvalidCharSet();

    public static string Sanitize(string fileName)
    {
        ArgumentNullException.ThrowIfNull(fileName);

        // Tab/CR/LF count as whitespace but are not always in Path.GetInvalidFileNameChars (e.g. Linux CI).
        // Resolve blank names before OS-specific replacement so exports stay consistent across runners.

        if (fileName.Length == 0)
            return MissingFileNameEntry;

        if (string.IsNullOrWhiteSpace(fileName))
            return EmptyFileNameEntry;

        string normalized = NormalizeTraversalHomoglyphs(fileName);
        string sanitized = new(normalized.Select(c => InvalidChars.Contains(c) ? '_' : c).ToArray());

        return string.IsNullOrWhiteSpace(sanitized) ? EmptyFileNameEntry : sanitized;
    }

    private static string NormalizeTraversalHomoglyphs(string fileName)
    {
        return fileName
            .Replace('\uFF0F', '_')
            .Replace('\uFF3C', '_')
            .Replace('\u2044', '_')
            .Replace('\u2215', '_');
    }

    private static HashSet<char> CreateInvalidCharSet()
    {
        HashSet<char> set = new(Path.GetInvalidFileNameChars());

        // Invalid on Windows; often still present in CI (Linux) unless explicitly stripped.

        foreach (char c in "<>:\"/\\|?*")
            set.Add(c);

        return set;
    }
}
