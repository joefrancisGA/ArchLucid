using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackInitOrchestratorTests
{
    [Fact]
    public void Run_from_example_writes_artifacts_when_force_is_set()
    {
        string repoRoot = RequireRepositoryRoot();
        string outputDirectory = Path.Combine(Path.GetTempPath(), "archlucid-stack-init-" + Guid.NewGuid().ToString("N"));

        try
        {
            StackInitOptions options = new()
            {
                FromExample = true,
                RepositoryRoot = repoRoot,
                OutputDirectory = outputDirectory,
                Force = true,
            };

            ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

            result.ExitCode.Should().Be(CliExitCode.Success);
            result.OutputDirectory.Should().Be(outputDirectory);
            Directory.Exists(outputDirectory).Should().BeTrue();
            Directory.EnumerateFiles(outputDirectory, "*", SearchOption.AllDirectories).Should().NotBeEmpty();
        }
        finally
        {
            if (Directory.Exists(outputDirectory))
                Directory.Delete(outputDirectory, recursive: true);
        }
    }

    [Fact]
    public void Run_rejects_existing_output_directory_without_force()
    {
        string repoRoot = RequireRepositoryRoot();
        string outputDirectory = Path.Combine(Path.GetTempPath(), "archlucid-stack-init-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(outputDirectory);

            StackInitOptions options = new()
            {
                FromExample = true,
                RepositoryRoot = repoRoot,
                OutputDirectory = outputDirectory,
                Force = false,
            };

            ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

            result.ExitCode.Should().Be(CliExitCode.UsageError);
            result.Messages.Should().ContainSingle(m => m.Contains("already exists", StringComparison.Ordinal));
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

        StackInitOptions options = new()
        {
            FromExample = false,
            RepositoryRoot = repoRoot,
            AnswersPath = missingAnswers,
        };

        ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

        result.ExitCode.Should().Be(CliExitCode.UsageError);
        result.Messages.Should().ContainSingle(m => m.Contains("not found", StringComparison.Ordinal));
    }

    [Fact]
    public void Run_returns_operation_failed_for_invalid_repository_root()
    {
        StackInitOptions options = new()
        {
            FromExample = true,
            RepositoryRoot = Path.Combine(Path.GetTempPath(), "not-archlucid-" + Guid.NewGuid().ToString("N")),
        };

        ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

        result.ExitCode.Should().Be(CliExitCode.OperationFailed);
        result.Messages.Should().ContainSingle(m => m.Contains("repository root", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Run_returns_operation_failed_when_example_file_is_missing()
    {
        string fakeRoot = Path.Combine(Path.GetTempPath(), "archlucid-fake-root-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(Path.Combine(fakeRoot, "docs", "go-to-market"));
            File.WriteAllText(Path.Combine(fakeRoot, "docs", "go-to-market", "AZURE_MARKETPLACE_SAAS_OFFER.md"), "marker");

            StackInitOptions options = new()
            {
                FromExample = true,
                RepositoryRoot = fakeRoot,
                Force = true,
            };

            ArchlucidStackInitOrchestrator.Result result = ArchlucidStackInitOrchestrator.Run(options);

            result.ExitCode.Should().Be(CliExitCode.OperationFailed);
            result.Messages.Should().ContainSingle(m => m.Contains("Example stack file missing", StringComparison.Ordinal));
        }
        finally
        {
            if (Directory.Exists(fakeRoot))
                Directory.Delete(fakeRoot, recursive: true);
        }
    }

    private static string RequireRepositoryRoot()
    {
        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot(AppContext.BaseDirectory);
        repoRoot.Should().NotBeNull("tests require ArchLucid repository root marker");

        return repoRoot!;
    }
}
