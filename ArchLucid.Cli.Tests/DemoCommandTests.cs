using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoCommandTests
{
    [Fact]
    public async Task Demo_export_unknown_flag_returns_usage_error()
    {
        StringWriter errWriter = new();
        TextWriter prevErr = Console.Error;
        Console.SetError(errWriter);
        string prev = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(ResolveRepositoryRootFromTests());

            int exit = await Program.RunAsync(["demo", "export", "--nope"]);

            exit.Should().Be(CliExitCode.UsageError);
            errWriter.ToString().Should().Contain("Unexpected argument");
        }
        finally
        {
            Directory.SetCurrentDirectory(prev);
            Console.SetError(prevErr);
        }
    }

    [Fact]
    public async Task Demo_export_copies_sample_pack_to_temp()
    {
        StringWriter outWriter = new();
        TextWriter prevOut = Console.Out;
        Console.SetOut(outWriter);
        string prev = Directory.GetCurrentDirectory();
        string dest = Path.Combine(Path.GetTempPath(), "archlucid-demo-pack-test-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.SetCurrentDirectory(ResolveRepositoryRootFromTests());

            int exit = await Program.RunAsync(["demo", "export", "--out", dest]);

            exit.Should().Be(CliExitCode.Success);
            File.Exists(Path.Combine(dest, "manifest-snippet.json")).Should().BeTrue();
        }
        finally
        {
            if (Directory.Exists(dest))
            {
                Directory.Delete(dest, recursive: true);
            }

            Directory.SetCurrentDirectory(prev);
            Console.SetOut(prevOut);
        }
    }

    private static string ResolveRepositoryRootFromTests()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        for (int ascent = 0; ascent < 28 && directory is not null; ascent++)
        {
            string marker = Path.Combine(directory.FullName, "docs", "go-to-market", "MARKETPLACE_PUBLICATION.md");

            if (File.Exists(marker))
                return directory.FullName;

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Repository root not found.");
    }
}
