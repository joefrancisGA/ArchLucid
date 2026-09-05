using System.IO.Compression;

namespace ArchLucid.Cli.Commands;

internal static partial class SponsorPacketWriter
{
    internal static async Task<int> WriteZipAsync(
        string sourceDirectory,
        string zipPath,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceDirectory);
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        string fullSource = Path.GetFullPath(sourceDirectory);

        if (!Directory.Exists(fullSource))
            throw new DirectoryNotFoundException(fullSource);

        string? zipDirectory = Path.GetDirectoryName(Path.GetFullPath(zipPath));

        if (!string.IsNullOrEmpty(zipDirectory))
            Directory.CreateDirectory(zipDirectory);

        if (File.Exists(zipPath))
            File.Delete(zipPath);

        string[] files = Directory.GetFiles(fullSource);
        Array.Sort(files, StringComparer.Ordinal);

        await using FileStream zipStream = new(zipPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        using ZipArchive archive = new(zipStream, ZipArchiveMode.Create);

        foreach (string filePath in files)
        {
            string entryName = Path.GetFileName(filePath);
            ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);

            await using Stream entryStream = entry.Open();
            await using FileStream input = new(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            await input.CopyToAsync(entryStream, cancellationToken);
        }

        return CliExitCode.Success;
    }
}
