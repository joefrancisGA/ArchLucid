using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-2 architecture create/review robustness suggestions (11–20).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave2ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion11_fail_closed_pinning_types_exist()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitecturePinningFailedException.cs"))
            .Should()
            .BeTrue();

        string kernel = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs"));

        kernel.Should().Contain("EnsureArchitectureIdentityAsync");
        kernel.Should().NotContain("synthesis continues");
    }

    [Fact]
    public void Suggestion12_artifact_fingerprint_service_exists()
    {
        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureVersionContentFingerprint.cs"))
            .Should()
            .BeTrue();

        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Persistence",
                    "Migrations",
                    "340_ArchitectureVersionArtifactHash_DraftRevisionPin.sql"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion13_draft_spawn_pins_architecture_version()
    {
        string draftResponse = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Drafts", "DraftRequestResponse.cs"));

        draftResponse.Should().Contain("SpawnedArchitectureVersionId");
    }

    [Fact]
    public void Suggestion14_finding_analysis_context_is_wired()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "FindingAnalysisContext.cs"))
            .Should()
            .BeTrue();

        string orchestrator = ArchitectureSourceProbe.ReadFindingsPipeline();

        orchestrator.Should().Contain("FindingAnalysisContextGraphStamp.Stamp");

        string mergeStage = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "Findings", "FindingsMergeAndGateStage.cs"));

        mergeStage.Should().Contain("PolicyPackCategoryCoverageValidator");
    }

    [Fact]
    public void Suggestion15_post_commit_v2_appendix_enqueue_removed()
    {
        string enqueuer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "PostCommitProjectionEnqueuer.cs"));

        enqueuer.Should().NotContain("PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization");

        string idempotencyHandler = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitIdempotencyHandler.cs"));

        idempotencyHandler.Should().NotContain("EnqueueDecisionEngineV2NodeMaterializationAsync");
    }

    [Fact]
    public void Suggestion16_authority_lifecycle_phase_resolver_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "AuthorityRunLifecyclePhaseResolver.cs"))
            .Should()
            .BeTrue();

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Common", "AuthorityRunLifecyclePhase.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion17_specialist_findings_contributor_exists()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "ArchitectureIntelligence",
                    "ArchitectureIntelligenceAuthorityFindingsContributor.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion18_manifest_hash_field_inclusion_doc_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "library", "MANIFEST_HASH_FIELD_INCLUSION.md")).Should().BeTrue();
    }

    [Fact]
    public void Suggestion19_graph_reuse_requires_observation_fingerprint()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "Graph", "GraphSnapshotCommittedReuseResolver.cs"));

        resolver.Should().Contain("IsObservationallyEqual");
        resolver.Should().Contain("contextCanonicalFingerprint");
    }

    [Fact]
    public void Suggestion20_typed_prior_snapshots_exist()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "PriorReviewSnapshots.cs"))
            .Should()
            .BeTrue();

        string builder = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        builder.Should().Contain("PriorReviewSnapshots");
    }
}
