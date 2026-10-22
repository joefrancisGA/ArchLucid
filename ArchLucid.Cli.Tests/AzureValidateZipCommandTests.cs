using System.IO.Compression;
using System.Text;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureValidateZipCommandTests
{
    [Fact]
    public async Task ValidateZip_valid_package_exits_0()
    {
        RedirectConsole(out StringWriter outWriter, out StringWriter errWriter, out TextWriter prevOut,
            out TextWriter prevErr);
        try
        {
            using TempDirectory temp = new();
            string path = Path.Combine(temp.Path, "package.zip");
            await File.WriteAllBytesAsync(path, BuildValidExtractorZip());

            int exit = await Program.RunAsync(["azure", "validate-zip", "--path", path]);

            exit.Should().Be(CliExitCode.Success);
            outWriter.ToString().Should().Contain("Valid Azure extractor ZIP");
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

            int exit = await Program.RunAsync(["azure", "validate-zip", "--path", path]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("manifest.json");
        }
        finally
        {
            RestoreConsole(prevOut, prevErr);
        }
    }

    private static byte[] BuildValidExtractorZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write(
                    """
                    {"schemaVersion":1,"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-05-06T12:00:00Z","subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}
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
            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using StreamWriter writer = new(resources.Open());

            writer.Write("[]");
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
        public TempDirectory()
        {
            Directory.CreateDirectory(Path);
        }

        public string Path { get; } = System.IO.Path.Combine(System.IO.Path.GetTempPath(),
            "ArchLucid.Cli.Tests." + Guid.NewGuid().ToString("N")[..8]);

        public void Dispose()
        {
            Directory.Delete(Path, true);
        }
    }
}
