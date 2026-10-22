namespace ArchLucid.Core.Compression;

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
