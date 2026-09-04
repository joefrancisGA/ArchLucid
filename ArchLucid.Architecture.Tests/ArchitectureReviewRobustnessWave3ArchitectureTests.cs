using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-3 architecture create/review robustness suggestions (21–30).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave3ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion21_finding_engines_accept_analysis_context()
    {
        string engineInterface = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Interfaces", "IFindingEngine.cs"));

        engineInterface.Should().Contain("FindingAnalysisContext? analysisContext");

        string orchestrator = ArchitectureSourceProbe.ReadFindingsPipeline();

        orchestrator.Should().Contain("analysisContext");
    }

    [Fact]
    public void Suggestion22_engine_registration_distinctness_hosted_service_exists()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Findings",
                    "FindingEngineRegistrationDistinctnessValidator.cs"))
            .Should()
            .BeTrue();

        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Hosting",
                    "FindingEngineRegistrationDistinctnessHostedService.cs"))
            .Should()
            .BeTrue();

        string discovery = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Plugins", "FindingEnginePluginDiscovery.cs"));

        discovery.Should().Contain("InvalidOperationException");
    }

    [Fact]
    public void Suggestion23_graph_reuse_fail_closed_on_missing_fingerprints()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "Graph", "GraphSnapshotCommittedReuseResolver.cs"));

        resolver.Should().Contain("expectedArchitectureVersionId");
        resolver.Should().Contain("return false");
    }

    [Fact]
    public void Suggestion24_authority_lifecycle_phase_exposed_and_commit_gated()
    {
        string runDetail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "ArchitectureRunDetail.cs"));

        runDetail.Should().Contain("AuthorityLifecyclePhase");

        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("AuthorityRunLifecyclePhaseResolver");
        commitIntegrity.Should().Contain("authority lifecycle phase");
    }

    [Fact]
    public void Suggestion25_draft_document_content_hash_pin_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Drafts", "DraftDocumentContentFingerprint.cs"))
            .Should()
            .BeTrue();

        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Persistence",
                    "Migrations",
                    "341_DraftDocumentContentHashPin.sql"))
            .Should()
            .BeTrue();

        string submit = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftAdmissionService.SubmitAndHeal.cs"));

        submit.Should().Contain("SpawnedDocumentContentHashSha256");
        submit.Should().Contain("EnsureSpawnedDocumentHashMatches");
    }

    [Fact]
    public void Suggestion26_policy_pack_required_category_resolver_exists()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Findings",
                    "PolicyPackRequiredFindingCategoryResolver.cs"))
            .Should()
            .BeTrue();

        string context = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "FindingAnalysisContext.cs"));

        context.Should().Contain("RequiredFindingCategories");
    }

    [Fact]
    public void Suggestion27_specialist_finding_authority_embedding_exists()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "ArchitectureIntelligence",
                    "SpecialistFindingAuthorityEmbedding.cs"))
            .Should()
            .BeTrue();

        string contributor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceAuthorityFindingsContributor.cs"));

        contributor.Should().Contain("SpecialistFindingAuthorityEmbedding.Embed");
    }

    [Fact]
    public void Suggestion28_create_architecture_avoids_four_agent_loop()
    {
        string kernel = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs"));

        kernel.Should().Contain("EnsureArchitectureIdentityAsync");
        kernel.Should().NotContain("IArchitectureRunExecuteOrchestrator");
        kernel.Should().NotContain("EnsureCommitReadyAgentResults");
    }

    [Fact]
    public void Suggestion29_orchestrator_uses_confluent_merger()
    {
        string mergeStage = ArchitectureSourceProbe.ReadFindingsPipeline();

        mergeStage.Should().Contain("FindingSnapshotConfluentMerger");
        mergeStage.Should().NotContain("type|title");
    }

    [Fact]
    public void Suggestion30_structural_execution_mode_commit_guard_exists()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Orchestration",
                    "StructuralExecutionModeCommitGuard.cs"))
            .Should()
            .BeTrue();

        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("StructuralExecutionModeCommitGuard");
    }
}
