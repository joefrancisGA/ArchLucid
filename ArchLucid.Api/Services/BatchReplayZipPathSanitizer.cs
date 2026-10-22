namespace ArchLucid.Api.Services;

/// <summary>Produces a single path segment safe for <see cref="System.IO.Compression.ZipArchive" /> entry names.</summary>
public static class BatchReplayZipPathSanitizer
{
    public static string FolderForComparisonRecordId(string comparisonRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);

        char[] invalid = Path.GetInvalidFileNameChars();

        return new string(comparisonRecordId
            .Select(c => IsUnsafeZipPathSegmentChar(c, invalid) ? '_' : c)
            .ToArray());
    }

    private static bool IsUnsafeZipPathSegmentChar(char c, char[] invalidFileNameChars)
    {
        if (c is '/' or '\\')
            return true;

        // ':' is valid on Linux file names but breaks Windows paths and zip folder segments cross-platform.

        if (c is ':' or '*' or '?' or '"' or '<' or '>' or '|')
            return true;

        return Array.IndexOf(invalidFileNameChars, c) >= 0;
    }
}
