using System.IO.Compression;
using System.Text;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CloudInventoryValidateZipCommandTests
{
    [Theory]
    [InlineData("aws", "Valid AWS inventory ZIP")]
    [InlineData("gcp", "Valid GCP inventory ZIP")]
    public async Task ValidateZip_valid_package_exits_0(string commandPrefix, string successSnippet)
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "package.zip");
            await File.WriteAllBytesAsync(path, BuildValidInventoryZip());

            int exit = await Program.RunAsync([commandPrefix, "validate-zip", "--path", path]);

            exit.Should().Be(CliExitCode.Success);
            outWriter.ToString().Should().Contain(successSnippet);
            errWriter.ToString().Should().BeEmpty();
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    [Fact]
    public async Task ValidateZip_missing_manifest_exits_1()
    {
        RedirectConsole(out StringWriter _, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "bad.zip");
            await File.WriteAllBytesAsync(path, BuildZipWithoutManifest());

            int exit = await Program.RunAsync(["aws", "validate-zip", "--path", path]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("manifest.json");
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    private static byte[] BuildValidInventoryZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write(
                    """
                    {"schemaVersion":1,"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-06-25T12:00:00Z","cloudProvider":"Aws","accountId":"123456789012"}
                    """);
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using (StreamWriter writer = new(resources.Open()))
            {
                writer.Write("[]");
            }
        }

        return ms.ToArray();
    }

    private static byte[] BuildZipWithoutManifest()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry readme = zip.CreateEntry("readme.txt");

            using StreamWriter writer = new(readme.Open());

            writer.Write("no manifest");
        }

        return ms.ToArray();
    }

    private static void RedirectConsole(
        out StringWriter outWriter,
        out StringWriter errWriter,
        out TextWriter prevOut,
        out TextWriter prevErr)
    {
        outWriter = new StringWriter();
        errWriter = new StringWriter();
        prevOut = Console.Out;
        prevErr = Console.Error;
        Console.SetOut(outWriter);
        Console.SetError(errWriter);
    }

    private static void RestoreConsole(TextWriter prevOut, TextWriter prevErr)
    {
        Console.SetOut(prevOut);
        Console.SetError(prevErr);
    }

    private sealed class TempDirectory : IDisposable
    {
        internal TempDirectory()
        {
            Path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(Path);
        }

        internal string Path { get; }

        public void Dispose()
        {
            if (Directory.Exists(Path))
                Directory.Delete(Path, recursive: true);
        }
    }
}
