using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.Analysis.ComparisonBatchReplay;

/// <summary>ZIP batch replay packaging result.</summary>
public sealed class ComparisonBatchReplayZipResult
{
    public required byte[] ZipBytes
    {
        get;
        init;
    }

    public bool IsPartialSuccess
    {
        get;
        init;
    }
}

/// <summary>Manifest written into comparison batch replay ZIP archives.</summary>
public sealed class ComparisonBatchReplayManifestDocument
{
    public string? GeneratedUtc
    {
        get;
        set;
    }

    public IReadOnlyList<string> ProcessedComparisonRecordIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<ComparisonBatchReplayManifestSuccessEntry> Succeeded
    {
        get;
        set;
    } = [];

    public IReadOnlyList<ComparisonBatchReplayManifestFailureEntry> Failed
    {
        get;
        set;
    } = [];
}

public sealed class ComparisonBatchReplayManifestSuccessEntry
{
    public string ComparisonRecordId
    {
        get;
        set;
    } = string.Empty;

    public string ZipEntryPath
    {
        get;
        set;
    } = string.Empty;
}

public sealed class ComparisonBatchReplayManifestFailureEntry
{
    public string ComparisonRecordId
    {
        get;
        set;
    } = string.Empty;

    public string Reason
    {
        get;
        set;
    } = string.Empty;

    public string ExceptionType
    {
        get;
        set;
    } = string.Empty;
}

internal static class ComparisonBatchReplayZipSupport
{
    public const string ManifestEntryName = "batch-replay-manifest.json";

    public static string FolderForComparisonRecordId(string comparisonRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);

        char[] invalid = Path.GetInvalidFileNameChars();

        return new string(comparisonRecordId
            .Select(c => IsUnsafeZipPathSegmentChar(c, invalid) ? '_' : c)
            .ToArray());
    }

    public static byte[] GetComparisonReplayEntryBytes(ReplayComparisonResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (string.Equals(result.Format, "markdown", StringComparison.OrdinalIgnoreCase)
            || string.Equals(result.Format, "html", StringComparison.OrdinalIgnoreCase))
        {
            return Encoding.UTF8.GetBytes(result.Content ?? string.Empty);
        }

        return result.BinaryContent ?? [];
    }

    public static byte[] ToManifestUtf8Bytes(ComparisonBatchReplayManifestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return JsonSerializer.SerializeToUtf8Bytes(
            document,
            new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true });
    }

    public static async Task<ComparisonBatchReplayZipResult> BuildZipAsync(
        IReadOnlyList<(string Id, ReplayComparisonResult Result)> successes,
        IReadOnlyList<string> processedIds,
        IReadOnlyList<ComparisonBatchReplayManifestFailureEntry> failed,
        CancellationToken ct)
    {
        MemoryStream ms = new();

        await using (ZipArchive zip = new(ms, ZipArchiveMode.Create, true))
        {
            List<ComparisonBatchReplayManifestSuccessEntry> succeededManifest = [];

            foreach ((string id, ReplayComparisonResult result) in successes)
            {
                string entryName = result.FileName;

                if (string.IsNullOrWhiteSpace(entryName))
                    entryName = $"comparison_{id}.{result.Format}";

                string folder = FolderForComparisonRecordId(id);
                string zipEntryPath = $"{folder}/{entryName}";
                ZipArchiveEntry entry = zip.CreateEntry(zipEntryPath, CompressionLevel.Fastest);
                await using Stream entryStream = await entry.OpenAsync(ct);
                byte[] payload = GetComparisonReplayEntryBytes(result);
                await entryStream.WriteAsync(payload, ct);

                succeededManifest.Add(
                    new ComparisonBatchReplayManifestSuccessEntry
                    {
                        ComparisonRecordId = id,
                        ZipEntryPath = zipEntryPath,
                    });
            }

            ComparisonBatchReplayManifestDocument manifest = new()
            {
                GeneratedUtc = TimeProvider.System.UtcNowDateTime().ToString("o", CultureInfo.InvariantCulture),
                ProcessedComparisonRecordIds = processedIds,
                Succeeded = succeededManifest,
                Failed = failed,
            };

            byte[] manifestBytes = ToManifestUtf8Bytes(manifest);
            ZipArchiveEntry manifestEntry = zip.CreateEntry(ManifestEntryName, CompressionLevel.Fastest);
            await using Stream manifestStream = await manifestEntry.OpenAsync(ct);
            await manifestStream.WriteAsync(manifestBytes, ct);
        }

        return new ComparisonBatchReplayZipResult
        {
            ZipBytes = ms.ToArray(),
            IsPartialSuccess = failed.Count > 0 && successes.Count > 0,
        };
    }

    private static bool IsUnsafeZipPathSegmentChar(char c, char[] invalidFileNameChars)
    {
        if (c is '/' or '\\')
            return true;

        if (c is ':' or '*' or '?' or '"' or '<' or '>' or '|')
            return true;

        return Array.IndexOf(invalidFileNameChars, c) >= 0;
    }
}
