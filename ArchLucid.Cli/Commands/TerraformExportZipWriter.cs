using System.IO.Compression;

namespace ArchLucid.Cli.Commands;

internal static class TerraformExportZipWriter
{
    internal static async Task ZipDirectoryAsync(string sourceDir, string zipFilePath)

    {

        ArgumentException.ThrowIfNullOrWhiteSpace(sourceDir);

        ArgumentException.ThrowIfNullOrWhiteSpace(zipFilePath);

        if (!Directory.Exists(sourceDir))

            throw new DirectoryNotFoundException(sourceDir);

        string absoluteZip = Path.GetFullPath(zipFilePath);

        string zipDir = Path.GetDirectoryName(absoluteZip)!;

        Directory.CreateDirectory(zipDir);

        if (File.Exists(absoluteZip))

            File.Delete(absoluteZip);

        await Task.Run(() =>

        {

            ZipFile.CreateFromDirectory(
                sourceDir,

                absoluteZip,

                CompressionLevel.Optimal,

                includeBaseDirectory: false);

        }).ConfigureAwait(false);

    }

}
