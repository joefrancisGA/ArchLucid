using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-058 ratchet: Lane B support-ratio consumption stays async and off the execute hot path.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs058AsyncSupportRatioArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As058_lane_b_reader_and_composer_types_exist()
    {
        string reader = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Findings",
                "FindingSemanticSupportBandAsyncLaneBReader.cs"));

        string composer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Findings",
                "FindingSemanticSupportBandComposer.cs"));

        reader.Should().Contain("FindingSemanticSupportBandAsyncLaneBReader");
        composer.Should().Contain("AsyncMayLagHonestyCopy");
    }

    [Fact]
    public void As058_run_detail_query_applies_lane_b_compose_on_read_path()
    {
        string detailLoad = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "RunDetailQueryService.DetailLoad.cs"));

        string semanticSupport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "RunDetailQueryService.SemanticSupportBand.cs"));

        detailLoad.Should().Contain("ApplySemanticSupportBandOverlaysAndLaneBComposeAsync");
        semanticSupport.Should().Contain("ApplyToAgentResultsAsync");
    }

    [Fact]
    public void As058_findings_merge_stage_does_not_enqueue_lane_b_jobs()
    {
        string stage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Services",
                "Findings",
                "FindingsMergeAndGateStage.cs"));

        stage.Should().Contain("FindingSemanticSupportBandEmissionApplicator.Apply");
        stage.Should().NotContain("LaneBCompose");
        stage.Should().NotContain("faithfulnessChecker");
        stage.Should().NotContain("AgentOutputSemanticEvaluator");
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
