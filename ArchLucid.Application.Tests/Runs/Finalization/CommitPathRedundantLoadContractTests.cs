using System.Text;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>
///     TB-588 — commit orchestrator and finalization request wire preloaded findings/assignments through the commit path.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommitPathRedundantLoadContractTests
{
    [Fact]
    public void Authority_commit_orchestrator_passes_preloaded_governance_and_findings_into_finalization()
    {
        string repoRoot = FindRepoRoot();
        string orchestratorPath = Path.Combine(
            repoRoot,
            "ArchLucid.Application",
            "Runs",
            "Orchestration",
            "AuthorityDrivenArchitectureRunCommitOrchestrator.cs");
        string text = File.ReadAllText(orchestratorPath, Encoding.UTF8);

        text.Should().Contain("PreCommitGovernancePreloadedData");
        text.Should().Contain("PreloadedFindingsSnapshot = findingsForFinalization");
        text.Should().Contain("PreloadedScopePolicyPackAssignments = scopePolicyPackAssignments");
    }

    [Fact]
    public void Manifest_finalization_request_documents_preload_skip_paths()
    {
        string repoRoot = FindRepoRoot();
        string requestPath = Path.Combine(
            repoRoot,
            "ArchLucid.Application",
            "Runs",
            "Finalization",
            "ManifestFinalizationRequest.cs");
        string text = File.ReadAllText(requestPath, Encoding.UTF8);

        text.Should().Contain("TB-588");
        text.Should().Contain("PreloadedFindingsSnapshot");
        text.Should().Contain("PreloadedScopePolicyPackAssignments");
    }

    private static string FindRepoRoot()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            string sln = Path.Combine(directory.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return directory.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from test output directory.");
    }
}
