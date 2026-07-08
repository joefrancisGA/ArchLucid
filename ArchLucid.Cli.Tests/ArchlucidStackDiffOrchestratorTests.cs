using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackDiffOrchestratorTests
{
    [Fact]
    public void Run_reports_success_when_generated_files_match_answers()
    {
        string repoRoot = RequireRepositoryRoot();
        string outputDirectory = Path.Combine(Path.GetTempPath(), "archlucid-stack-diff-" + Guid.NewGuid().ToString("N"));

        try
        {
            ArchlucidStackInitOrchestrator.Result init = ArchlucidStackInitOrchestrator.Run(
                new StackInitOptions
                {
                    FromExample = true,
                    RepositoryRoot = repoRoot,
                    OutputDirectory = outputDirectory,
                    Force = true,
                });

            init.ExitCode.Should().Be(CliExitCode.Success);

            ArchlucidStackDiffOrchestrator.Result diff = ArchlucidStackDiffOrchestrator.Run(
                new StackDiffOptions
                {
                    RepositoryRoot = repoRoot,
                    AnswersPath = Path.Combine(repoRoot, ArchlucidStackPaths.ExampleRelativePath),
                    OutputDirectory = outputDirectory,
                });

            diff.ExitCode.Should().Be(CliExitCode.Success);
            diff.Diffs.Should().BeEmpty();
        }
        finally
        {
            if (Directory.Exists(outputDirectory))
                Directory.Delete(outputDirectory, recursive: true);
        }
    }

    [Fact]
    public void Run_reports_drift_when_on_disk_file_differs()
    {
        string repoRoot = RequireRepositoryRoot();
        string outputDirectory = Path.Combine(Path.GetTempPath(), "archlucid-stack-diff-" + Guid.NewGuid().ToString("N"));

        try
        {
            ArchlucidStackInitOrchestrator.Result init = ArchlucidStackInitOrchestrator.Run(
                new StackInitOptions
                {
                    FromExample = true,
                    RepositoryRoot = repoRoot,
                    OutputDirectory = outputDirectory,
                    Force = true,
                });

            init.ExitCode.Should().Be(CliExitCode.Success);

            string driftedPath = Path.Combine(outputDirectory, "terraform-private.tfvars");
            File.Exists(driftedPath).Should().BeTrue();
            File.WriteAllText(driftedPath, "# drifted\n");

            ArchlucidStackDiffOrchestrator.Result diff = ArchlucidStackDiffOrchestrator.Run(
                new StackDiffOptions
                {
                    RepositoryRoot = repoRoot,
                    AnswersPath = Path.Combine(repoRoot, ArchlucidStackPaths.ExampleRelativePath),
                    OutputDirectory = outputDirectory,
                });

            diff.ExitCode.Should().Be(CliExitCode.OperationFailed);
            diff.Diffs.Should().Contain(d => d.RelativePath == "terraform-private.tfvars" && d.ContentDiffers);
        }
        finally
        {
            if (Directory.Exists(outputDirectory))
                Directory.Delete(outputDirectory, recursive: true);
        }
    }

    [Fact]
    public void Run_returns_usage_error_when_answers_file_is_missing()
    {
        string repoRoot = RequireRepositoryRoot();
        string missingAnswers = Path.Combine(Path.GetTempPath(), "missing-" + Guid.NewGuid().ToString("N") + ".yaml");

        ArchlucidStackDiffOrchestrator.Result result = ArchlucidStackDiffOrchestrator.Run(
            new StackDiffOptions
            {
                RepositoryRoot = repoRoot,
                AnswersPath = missingAnswers,
            });

        result.ExitCode.Should().Be(CliExitCode.UsageError);
        result.Messages.Should().ContainSingle(m => m.Contains("not found", StringComparison.Ordinal));
    }

    private static string RequireRepositoryRoot()
    {
        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot(AppContext.BaseDirectory);
        repoRoot.Should().NotBeNull("tests require ArchLucid repository root marker");

        return repoRoot!;
    }
}
