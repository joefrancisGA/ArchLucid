using System.Diagnostics;
using System.IO.Compression;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Expands evidence ZIP uploads with cumulative uncompressed size and extension whitelisting.
/// </summary>
public sealed class ZipEvidenceExpanderService(
    IOptions<ZipEvidenceExpanderOptions> options,
    ILogger<ZipEvidenceExpanderService> logger) : IZipEvidenceExpanderService
{
    private readonly ZipEvidenceExpanderOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<ZipEvidenceExpanderService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public ZipEvidenceExpansionResult Expand(Stream zipStream, string sourceArchiveName)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        using Activity? activity = ArchLucidInstrumentation.EvidenceZipExpansion.StartActivity("evidence.zip.expand");
        activity?.SetTag("archlucid.evidence.archive_name", sourceArchiveName);

        List<ZipEvidenceExpandedFile> files = [];
        List<string> skipped = [];
        long totalUncompressedBytes = 0;
        HashSet<string> allowedExtensions = BuildAllowedExtensionSet(_options.AllowedExtensions);

        using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

        foreach (ZipArchiveEntry entry in archive.Entries)
        {
            if (entry.FullName.EndsWith('/'))
            {
                skipped.Add($"{entry.FullName}: directory entry skipped");

                continue;
            }

            string fileName = NormalizeZipEntryFileName(entry.FullName);

            if (string.IsNullOrEmpty(fileName))
            {
                skipped.Add($"{entry.FullName}: empty file name skipped");

                continue;
            }

            string extension = Path.GetExtension(fileName);

            if (!allowedExtensions.Contains(extension))
            {
                skipped.Add($"{entry.FullName}: extension '{extension}' not allowed");

                continue;
            }

            if (entry.Length <= 0)
            {
                skipped.Add($"{entry.FullName}: empty file skipped");

                continue;
            }

            if (totalUncompressedBytes + entry.Length > _options.MaxUncompressedSizeBytes)
            {
                skipped.Add($"{entry.FullName}: cumulative uncompressed size limit exceeded");

                continue;
            }

            using Stream entryStream = entry.Open();
            using MemoryStream buffer = new();

            entryStream.CopyTo(buffer);
            byte[] content = buffer.ToArray();
            totalUncompressedBytes += content.LongLength;

            files.Add(new ZipEvidenceExpandedFile
            {
                FileName = fileName,
                Content = content
            });
        }

        if (skipped.Count > 0)
        {
            _logger.LogInformation(
                "Evidence ZIP expansion for {ArchiveName} skipped {SkippedCount} entries: {SkippedEntries}",
                sourceArchiveName,
                skipped.Count,
                string.Join("; ", skipped));
        }

        ZipEvidenceExpansionResult result = new()
        {
            Files = files,
            SkippedEntries = skipped
        };

        activity?.SetTag("archlucid.evidence.file_count", result.Files.Count);
        activity?.SetTag("archlucid.evidence.total_uncompressed_bytes", totalUncompressedBytes);

        return result;
    }

    /// <summary>Flattens nested ZIP paths so folder recursion becomes unique leaf file names.</summary>
    private static string NormalizeZipEntryFileName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return string.Empty;

        string normalized = fullName.Replace('\\', '/').Trim('/');

        if (string.IsNullOrEmpty(normalized))
            return string.Empty;

        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length == 0)
            return string.Empty;

        if (segments.Length == 1)
            return segments[0];

        return string.Join('_', segments);
    }

    private static HashSet<string> BuildAllowedExtensionSet(IReadOnlyList<string> configuredExtensions)
    {
        HashSet<string> set = new(StringComparer.OrdinalIgnoreCase);

        foreach (string extension in configuredExtensions)
        {
            if (string.IsNullOrWhiteSpace(extension))
                continue;

            string normalized = extension.StartsWith('.') ? extension : $".{extension}";

            set.Add(normalized);
        }

        return set;
    }
}