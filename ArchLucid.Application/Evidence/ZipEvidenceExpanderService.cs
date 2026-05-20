using System.IO.Compression;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Evidence;

public sealed class ZipEvidenceExpanderService(
    IOptions<ZipEvidenceExpanderOptions> options,
    ILogger<ZipEvidenceExpanderService> logger) : IZipEvidenceExpanderService
{
    private readonly ZipEvidenceExpanderOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<ZipEvidenceExpanderService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public ZipEvidenceExpansionResult Expand(Stream zipStream, string sourceArchiveName)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

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

            string fileName = Path.GetFileName(entry.FullName);

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

        return new ZipEvidenceExpansionResult
        {
            Files = files,
            SkippedEntries = skipped
        };
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