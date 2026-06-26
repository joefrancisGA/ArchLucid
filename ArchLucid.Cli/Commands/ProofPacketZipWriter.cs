using System.IO.Compression;

namespace ArchLucid.Cli.Commands;

/// <summary>ZIP helper for <c>archlucid proof-packet</c>.</summary>
internal static class ProofPacketZipWriter
{
    public static async Task WriteDirectoryToZipAsync(
        string sourceDirectory,
        string zipPath,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceDirectory);
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        if (!Directory.Exists(sourceDirectory))
            throw new DirectoryNotFoundException($"Proof packet directory not found: {sourceDirectory}");

        string fullZipPath = Path.GetFullPath(zipPath);
        string? zipDirectory = Path.GetDirectoryName(fullZipPath);

        if (!string.IsNullOrEmpty(zipDirectory))
            Directory.CreateDirectory(zipDirectory);

        if (File.Exists(fullZipPath))
            File.Delete(fullZipPath);

        await Task.Run(
            () =>
            {
                ZipFile.CreateFromDirectory(
                    sourceDirectory,
                    fullZipPath,
                    CompressionLevel.Optimal,
                    includeBaseDirectory: false);
            },
            cancellationToken);
    }
}
