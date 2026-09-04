using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-4 architecture create/review robustness suggestions (31–40).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave4ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion31_cross_run_engines_require_prior_guard()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Findings",
                    "CrossRunDiffFindingPriorGuard.cs"))
            .Should()
            .BeTrue();

        string topologyEngine = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "TopologyCrossRunDiffFindingEngine.cs"));

        topologyEngine.Should().Contain("CrossRunDiffFindingPriorGuard.EnsurePriorPresentOrThrow");
    }

    [Fact]
    public void Suggestion32_evidence_pin_on_finding_analysis_context()
    {
        string context = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "FindingAnalysisContext.cs"));

        context.Should().Contain("EvidencePackagePin? EvidencePin");

        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"));

        pinService.Should().Contain("ResolvePinsFromHeader");
        pinService.Should().Contain("HasCreateTimePinCommitment");
    }

    [Fact]
    public void Suggestion33_pack_required_engine_types_entailment()
    {
        string packDocument = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Governance", "PolicyPackContentDocument.cs"));

        packDocument.Should().Contain("requiredEngineTypes");

        string mergeStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Services",
                "Findings",
                "FindingsMergeAndGateStage.cs"));

        mergeStage.Should().Contain("GetMissingEngineTypeViolations");
    }

    [Fact]
    public void Suggestion34_policy_pack_pin_at_run_create()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Persistence",
                    "Migrations",
                    "342_RunPolicyPackPin.sql"))
            .Should()
            .BeTrue();

        string migration342 = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations", "342_RunPolicyPackPin.sql"));

        migration342.Should().Contain("@runTable");
        migration342.Should().NotMatchRegex(@"(?m)^\s*ALTER\s+TABLE\s+dbo\.Runs\b");

        string bootstrapSql = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql"));

        bootstrapSql.Should().Contain("PinnedPolicyPackIdsJson");
        bootstrapSql.Should().Contain("@policyPackPinRunTable");

        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunPolicyPackPinService.cs"));

        pinService.Should().Contain("ApplyToRunHeaderAsync");
    }

    [Fact]
    public void Suggestion35_prior_from_version_lattice()
    {
        string builder = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        builder.Should().Contain("GetByArchitectureIdAndVersionNumberAsync");
        builder.Should().Contain("GetLatestCommittedRunIdByArchitectureVersionIdAsync");
    }

    [Fact]
    public void Suggestion36_replay_skips_agent_tasks_when_authority_complete()
    {
        string replayPrepare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunPrepareStage.cs"));

        replayPrepare.Should().Contain("AuthorityPipelineComplete");
        replayPrepare.Should().Contain("NoScheduledAgentTasksException");
    }

    [Fact]
    public void Suggestion37_stable_llm_recommendation_ids()
    {
        string stableId = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ArchitectureRecommendationStableId.cs"));

        stableId.Should().Contain("FromLlmRecommendation");

        string mapper = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceLlmResponseMapper.cs"));

        mapper.Should().Contain("ArchitectureRecommendationStableId.FromLlmRecommendation");
    }

    [Fact]
    public void Suggestion38_authority_lifecycle_phase_on_run_detail_response()
    {
        string runDetails = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Models", "RunDetailsResponse.cs"));

        runDetails.Should().Contain("AuthorityLifecyclePhase");

        string queryService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Services", "Authority", "RunGraphQueryService.cs"));

        queryService.Should().Contain("response.AuthorityLifecyclePhase");
    }

    [Fact]
    public void Suggestion39_block_create_on_mixed_or_fallback_mode()
    {
        string coordination = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Coordination",
                "ArchitectureRunAuthorityCoordination.cs"));

        coordination.Should().Contain("StructuralExecutionModeAdmittanceGuard.EnsureAdmittableOrThrow");
    }

    [Fact]
    public void Suggestion40_evidence_graph_materializer_before_findings()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Orchestration",
                    "Pipeline",
                    "EvidenceGraphMaterializer.cs"))
            .Should()
            .BeTrue();

        string findingsStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineFindingsStage.cs"));

        findingsStage.Should().Contain("_evidenceGraphMaterializer?.Materialize");
    }
}
