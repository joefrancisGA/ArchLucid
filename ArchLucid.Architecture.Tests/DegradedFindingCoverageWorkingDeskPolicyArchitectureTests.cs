using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     WS-14 degraded finding-engine coverage: Working seats block finalize on the server via
///     <c>CareerArtifactCompletenessValidator</c>; the UI scorecard uses
///     <c>blockDegradedFindingCoverageOnWorking</c> (wired from <c>buyerPolishedArtifactTable !== true</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DegradedFindingCoverageWorkingDeskPolicyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Server_blocks_degraded_coverage_on_working_desk_finalize_only()
    {
        string validator = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "CareerArtifacts", "CareerArtifactCompletenessValidator.cs"));

        validator.Should().Contain("if (!input.WorkingDesk || input.ArtifactKind != CareerArtifactKind.Finalize || !input.DegradedFindingCoverage)");
        validator.Should().Contain("DegradedFindingCoverageCode");
        validator.Should().Contain("FormatDegradedFindingCoverageBlockedReason");
    }

    [Fact]
    public void Orchestrator_passes_working_desk_and_degraded_coverage_into_finalize_completeness_input()
    {
        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("IsWorkingDeskAsync");
        orchestrator.Should().Contain("RunFindingCoverageProjection.Build");
        orchestrator.Should().Contain("MapForFinalize");
        orchestrator.Should().Contain("degradedFindingCoverage");
    }

    [Fact]
    public void Ui_scorecard_wires_working_desk_degraded_block_via_buyer_polished_inverse()
    {
        string governance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "run-detail-page-presentation-governance.ts"));

        governance.Should().Contain("blockDegradedFindingCoverageOnWorking: model.buyerPolishedArtifactTable !== true");
        governance.Should().Contain("degradedFindingCoverage: model.resolvedDetail.degradedFindingCoverage === true");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
