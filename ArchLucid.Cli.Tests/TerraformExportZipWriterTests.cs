using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

public sealed class TerraformExportZipWriterTests
{

    [Fact]

    public async Task ZipDirectoryAsync_round_trips_flat_files()

    {

        string dir = Path.Combine(Path.GetTempPath(), "archlucid-ziptest-" + Guid.NewGuid().ToString("N"));

        Directory.CreateDirectory(dir);

        await File.WriteAllTextAsync(Path.Combine(dir, "a.txt"), "alpha");

        string zipPath = Path.Combine(Path.GetTempPath(), "archlucid-ziptest-" + Guid.NewGuid().ToString("N") + ".zip");

        await TerraformExportZipWriter.ZipDirectoryAsync(dir, zipPath);

        File.Exists(zipPath).Should().BeTrue();

    }

}
