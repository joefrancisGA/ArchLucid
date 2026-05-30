using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Evidence;

/// <summary>Selects a streaming batch from a multipart bulk evidence upload (Improvement #10).</summary>
public static class BulkEvidenceUploadBatchSelector
{
    /// <summary>Default files processed per request when <paramref name="paginationToken" /> is used.</summary>
    public const int DefaultBatchSize = 10;

    /// <summary>
    ///     When <paramref name="paginationToken" /> is a non-negative integer string, returns that batch slice;
    ///     otherwise returns all files (single-shot upload).
    /// </summary>
    public static IReadOnlyList<IFormFile> SelectBatch(
        IFormFileCollection files,
        string? paginationToken,
        int batchSize)
    {
        ArgumentNullException.ThrowIfNull(files);

        if (files.Count == 0)
            return [];

        int effectiveBatchSize = Math.Clamp(batchSize, 1, 200);

        if (!TryParseBatchIndex(paginationToken, out int batchIndex))
            return files.ToList();

        int skip = batchIndex * effectiveBatchSize;

        if (skip >= files.Count)
            return [];

        return files.Skip(skip).Take(effectiveBatchSize).ToList();
    }

    /// <summary>Sums declared content lengths for payload-too-large guards.</summary>
    public static long SumDeclaredBytes(IEnumerable<IFormFile> files)
    {
        ArgumentNullException.ThrowIfNull(files);

        long total = 0;

        foreach (IFormFile file in files)
        {
            if (file.Length <= 0)
                continue;

            total += file.Length;
        }

        return total;
    }

    private static bool TryParseBatchIndex(string? paginationToken, out int batchIndex)
    {
        batchIndex = 0;

        if (string.IsNullOrWhiteSpace(paginationToken))
            return false;

        return int.TryParse(paginationToken.Trim(), out batchIndex) && batchIndex >= 0;
    }
}
