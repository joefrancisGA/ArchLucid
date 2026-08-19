using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackWorkspaceResolverTests
{
    [Fact]
    public void TryResolveRepositoryRoot_with_explicit_marker_file_returns_true()
    {
        string tempRoot = CreateRepositoryRootWithMarker();

        try
        {
            bool resolved = ArchlucidStackWorkspaceResolver.TryResolveRepositoryRoot(tempRoot, out string? repositoryRoot);

            resolved.Should().BeTrue();
            repositoryRoot.Should().Be(Path.GetFullPath(tempRoot));
        }
        finally
        {
            Directory.Delete(tempRoot, recursive: true);
        }
    }

    [Fact]
    public void TryResolveRepositoryRoot_with_invalid_explicit_root_returns_false()
    {
        string tempRoot = Path.Combine(Path.GetTempPath(), "archlucid-stack-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);

        try
        {
            bool resolved = ArchlucidStackWorkspaceResolver.TryResolveRepositoryRoot(tempRoot, out string? repositoryRoot);

            resolved.Should().BeFalse();
            repositoryRoot.Should().BeNull();
        }
        finally
        {
            Directory.Delete(tempRoot, recursive: true);
        }
    }

    [Fact]
    public void ResolveAnswersPath_prefers_example_and_explicit_paths()
    {
        string tempRoot = CreateRepositoryRootWithMarker();

        try
        {
            string examplePath = ArchlucidStackWorkspaceResolver.ResolveAnswersPath(
                tempRoot,
                explicitAnswersPath: null,
                fromExample: true);

            examplePath.Should().Be(Path.Combine(tempRoot, ArchlucidStackPaths.ExampleRelativePath));

            string explicitPath = Path.Combine(tempRoot, "custom.stack.yaml");
            File.WriteAllText(explicitPath, "stack: test");

            string resolvedExplicit = ArchlucidStackWorkspaceResolver.ResolveAnswersPath(
                tempRoot,
                explicitAnswersPath: explicitPath,
                fromExample: false);

            resolvedExplicit.Should().Be(Path.GetFullPath(explicitPath));
        }
        finally
        {
            Directory.Delete(tempRoot, recursive: true);
        }
    }

    [Fact]
    public void ResolveOutputDirectory_uses_generated_root_when_not_explicit()
    {
        string tempRoot = CreateRepositoryRootWithMarker();

        try
        {
            string output = ArchlucidStackWorkspaceResolver.ResolveOutputDirectory(
                tempRoot,
                explicitOutputDirectory: null,
                environment: "staging");

            output.Should().Be(Path.Combine(tempRoot, ArchlucidStackPaths.GeneratedRootRelativePath, "staging"));
        }
        finally
        {
            Directory.Delete(tempRoot, recursive: true);
        }
    }

    private static string CreateRepositoryRootWithMarker()
    {
        string tempRoot = Path.Combine(Path.GetTempPath(), "archlucid-stack-" + Guid.NewGuid().ToString("N"));
        string docsDir = Path.Combine(tempRoot, "docs", "go-to-market");
        Directory.CreateDirectory(docsDir);
        File.WriteAllText(Path.Combine(docsDir, "AZURE_MARKETPLACE_SAAS_OFFER.md"), "# test");

        return tempRoot;
    }
}
