using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantIsolationNegativeTestCommandArtifactsTests
{
    [Fact]
    public async Task WriteArtifactsAsync_writes_filename_only_json_out_to_working_directory()
    {
        string workingDirectory = Path.Combine(Path.GetTempPath(), "tenant-isolation-artifacts-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workingDirectory);
        string priorDirectory = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(workingDirectory);

            TenantIsolationNegativeTestOutputResolution outputPaths = new()
            {
                JsonPath = "tenant-isolation-negative-test.json",
            };

            await TenantIsolationNegativeTestCommand.WriteArtifactsAsync(
                outputPaths,
                """{"overallVerdict":"pass"}""",
                string.Empty,
                CancellationToken.None);

            File.Exists(Path.Combine(workingDirectory, "tenant-isolation-negative-test.json"))
                .Should()
                .BeTrue();
        }
        finally
        {
            Directory.SetCurrentDirectory(priorDirectory);

            if (Directory.Exists(workingDirectory))
                Directory.Delete(workingDirectory, recursive: true);
        }
    }

    [Fact]
    public async Task WriteArtifactsAsync_writes_utf8_without_byte_order_mark()
    {
        string workingDirectory = Path.Combine(Path.GetTempPath(), "tenant-isolation-artifacts-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workingDirectory);
        string priorDirectory = Directory.GetCurrentDirectory();

        try
        {
            Directory.SetCurrentDirectory(workingDirectory);

            TenantIsolationNegativeTestOutputResolution outputPaths = new()
            {
                JsonPath = "report.json",
                MarkdownPath = "report.md",
            };

            await TenantIsolationNegativeTestCommand.WriteArtifactsAsync(
                outputPaths,
                """{"overallVerdict":"pass"}""",
                "# Tenant isolation",
                CancellationToken.None);

            byte[] jsonBytes = await File.ReadAllBytesAsync(Path.Combine(workingDirectory, "report.json"));
            byte[] markdownBytes = await File.ReadAllBytesAsync(Path.Combine(workingDirectory, "report.md"));

            jsonBytes.Should().StartWith([(byte)'{']);
            markdownBytes.Should().StartWith([(byte)'#']);
        }
        finally
        {
            Directory.SetCurrentDirectory(priorDirectory);

            if (Directory.Exists(workingDirectory))
                Directory.Delete(workingDirectory, recursive: true);
        }
    }
}
