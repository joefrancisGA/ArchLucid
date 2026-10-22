using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
public sealed class PackExportScaffoldCommandTests
{
    [Fact]
    public async Task RunAsync_writes_scaffold_files_and_policy_pack_validates()
    {
        string outputDir = Path.Combine(Path.GetTempPath(), $"archlucid-pack-scaffold-{Guid.NewGuid():N}");

        try
        {
            int exit = await PackExportScaffoldCommand.RunAsync(["--output", outputDir]);

            exit.Should().Be(CliExitCode.Success);
            Directory.Exists(outputDir).Should().BeTrue();

            string policyPackPath = Path.Combine(outputDir, PackExportScaffoldWriter.PolicyPackFileName);
            string rulesPath = Path.Combine(outputDir, PackExportScaffoldWriter.ComplianceRulesFileName);
            string readmePath = Path.Combine(outputDir, PackExportScaffoldWriter.ReadmeFileName);

            File.Exists(policyPackPath).Should().BeTrue();
            File.Exists(rulesPath).Should().BeTrue();
            File.Exists(readmePath).Should().BeTrue();

            int validateExit = await PolicyValidateCommand.RunAsync(policyPackPath, "policy-pack validate");

            validateExit.Should().Be(CliExitCode.Success);
        }
        finally
        {
            if (Directory.Exists(outputDir))
                Directory.Delete(outputDir, recursive: true);
        }
    }

    [Fact]
    public async Task RunAsync_when_directory_not_empty_without_force_returns_operation_failed()
    {
        string outputDir = Path.Combine(Path.GetTempPath(), $"archlucid-pack-scaffold-{Guid.NewGuid():N}");
        Directory.CreateDirectory(outputDir);
        await File.WriteAllTextAsync(Path.Combine(outputDir, "existing.txt"), "blocker");

        try
        {
            int exit = await PackExportScaffoldCommand.RunAsync(["--output", outputDir]);

            exit.Should().Be(CliExitCode.OperationFailed);
        }
        finally
        {
            if (Directory.Exists(outputDir))
                Directory.Delete(outputDir, recursive: true);
        }
    }

    [Fact]
    public async Task RunAsync_with_force_overwrites_nonempty_directory()
    {
        string outputDir = Path.Combine(Path.GetTempPath(), $"archlucid-pack-scaffold-{Guid.NewGuid():N}");
        Directory.CreateDirectory(outputDir);
        await File.WriteAllTextAsync(Path.Combine(outputDir, "existing.txt"), "stale");

        try
        {
            int exit = await PackExportScaffoldCommand.RunAsync(["--output", outputDir, "--force"]);

            exit.Should().Be(CliExitCode.Success);
            File.Exists(Path.Combine(outputDir, PackExportScaffoldWriter.PolicyPackFileName)).Should().BeTrue();
        }
        finally
        {
            if (Directory.Exists(outputDir))
                Directory.Delete(outputDir, recursive: true);
        }
    }
}
