using System.IO.Compression;

namespace ArchLucid.Core.Compression;

/// <summary>
///     Shared ZIP entry path and zip-bomb guards for inventory and evidence ingest paths.
/// </summary>
public static class ZipArchiveSafety
{
    public const int DefaultMaxFileEntries = 1000;

    public const long DefaultMaxTotalUncompressedBytes = 500L * 1024 * 1024;

    public const int DefaultMaxCompressionRatio = 100;

    /// <summary>Rejects zip-slip, absolute paths, and drive-letter prefixes.</summary>
    public static bool IsSafeEntryPath(string entryPath)
    {
        if (string.IsNullOrWhiteSpace(entryPath))
            return false;

        string normalized = entryPath.Replace('\\', '/').Trim();

        if (normalized.StartsWith("/", StringComparison.Ordinal)
            || normalized.Contains("..", StringComparison.Ordinal)
            || normalized.Contains(":", StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }

    /// <summary>
    ///     Validates archive-level limits before reading entry payloads.
    /// </summary>
    public static ZipArchiveSafetyResult ValidateArchive(
        ZipArchive archive,
        long maxTotalUncompressedBytes = DefaultMaxTotalUncompressedBytes,
        int maxFileEntries = DefaultMaxFileEntries,
        int maxCompressionRatio = DefaultMaxCompressionRatio)
    {
        ArgumentNullException.ThrowIfNull(archive);

        int fileEntryCount = 0;
        long totalUncompressedBytes = 0;
        long totalCompressedBytes = 0;

        foreach (ZipArchiveEntry entry in archive.Entries)
        {
            if (entry.FullName.EndsWith('/'))
                continue;

            if (!IsSafeEntryPath(entry.FullName))
            {
                return ZipArchiveSafetyResult.Reject($"Unsafe ZIP entry path: {entry.FullName}");
            }

            fileEntryCount++;

            if (fileEntryCount > maxFileEntries)
            {
                return ZipArchiveSafetyResult.Reject(
                    $"ZIP exceeds maximum file entry count of {maxFileEntries}.");
            }

            long uncompressed = entry.Length;

            if (uncompressed < 0)
                uncompressed = 0;

            totalUncompressedBytes += uncompressed;
            totalCompressedBytes += Math.Max(0, entry.CompressedLength);

            if (totalUncompressedBytes > maxTotalUncompressedBytes)
            {
                return ZipArchiveSafetyResult.Reject(
                    $"ZIP cumulative uncompressed size exceeds {maxTotalUncompressedBytes} bytes.");
            }

            if (totalCompressedBytes > 0)
            {
                double ratio = (double)totalUncompressedBytes / Math.Max(1, totalCompressedBytes);

                if (ratio > maxCompressionRatio)
                {
                    return ZipArchiveSafetyResult.Reject(
                        $"ZIP compression ratio {ratio} exceeds maximum {maxCompressionRatio}.");
                }
            }
        }

        return ZipArchiveSafetyResult.Permit(fileEntryCount, totalUncompressedBytes);
    }
}

public sealed class ZipArchiveSafetyResult
{
    private ZipArchiveSafetyResult(bool allowed, string? errorDetail, int fileEntryCount, long totalUncompressedBytes)
    {
        Allowed = allowed;
        ErrorDetail = errorDetail;
        FileEntryCount = fileEntryCount;
        TotalUncompressedBytes = totalUncompressedBytes;
    }

    public bool Allowed { get; }

    public string? ErrorDetail { get; }

    public int FileEntryCount { get; }

    public long TotalUncompressedBytes { get; }

    public static ZipArchiveSafetyResult Permit(int fileEntryCount, long totalUncompressedBytes) =>
        new(true, null, fileEntryCount, totalUncompressedBytes);

    public static ZipArchiveSafetyResult Reject(string errorDetail) =>
        new(false, errorDetail, 0, 0);
}
