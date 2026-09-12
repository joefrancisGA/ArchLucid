using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for the ten architecture create/review robustness suggestions on branch <c>robust</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1_synthesis_kernel_isolated_from_review_execute()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs");
        string source = File.ReadAllText(path);

        source.Should().NotContain("IArchitectureRunExecuteOrchestrator");
        source.Should().NotContain("IAuthorityRunOrchestrator");
        source.Should().NotContain("EnsureCommitReadyAgentResults");
    }

    [Fact]
    public void Suggestion2_architecture_version_lattice_is_wired()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureVersionService.cs"))
            .Should()
            .BeTrue();

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations", "339_ArchitectureVersions.sql"))
            .Should()
            .BeTrue();

        string runRecord = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "ApplicationPorts", "Models", "RunRecord.cs"));

        runRecord.Should().Contain("ArchitectureVersionId");
    }

    [Fact]
    public void Suggestion3_commit_integrity_enforces_decision_grade_provenance()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Runs",
            "Orchestration",
            "CommitOutputIntegrityService.cs");

        string source = File.ReadAllText(path);

        source.Should().Contain("DecisionGradeFindingProvenanceValidator");
        source.Should().Contain("Commit blocked: one or more findings lack decision-grade provenance");
    }

    [Fact]
    public void Suggestion4_findings_orchestrator_uses_confluent_merge()
    {
        string source = ArchitectureSourceProbe.ReadFindingsPipeline();

        source.Should().Contain("FindingSnapshotConfluentMerger.Merge");
        source.Should().NotContain("GroupBy(static f => f.FindingType");
    }

    [Fact]
    public void Suggestion5_partial_engine_failure_surfaces_generation_status_and_commit_classifier()
    {
        string emitStage = ArchitectureSourceProbe.ReadFindingsPipeline();

        emitStage.Should().Contain("FindingsSnapshotGenerationStatus.PartiallyComplete");

        string decisioningStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineDecisioningStage.cs"));

        decisioningStage.Should().Contain("FindingEngineFailureCommitClassifier");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "FindingEngineFailureCommitClassifier.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion6_authority_complete_runs_reject_execute()
    {
        string source = ArchitectureSourceProbe.ReadExecuteOrchestratorPipeline();

        source.Should().Contain("ThrowIfAuthorityPipelineCompleteAsync");

        string scopeResolve = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Execute",
                "ArchitectureRunExecuteScopeResolveStage.cs"));

        scopeResolve.Should().Contain("RunKernelCompleteness.IsAuthorityPipelineComplete");
    }

    [Fact]
    public void Suggestion7_intake_gates_block_sentinels_and_cloud_pack_mismatch()
    {
        string draftValidator = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "ArchitectureDraftReviewReadinessValidator.cs"));

        draftValidator.Should().Contain("HasUnconfirmedStructuredBriefPlaceholders");

        string submit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Drafts",
                "DraftAdmissionService.SubmitAndHeal.cs"));

        submit.Should().Contain("ArchitectureDraftReviewReadinessValidator.EnsureReviewReady");

        string projector = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftRequestProjector.cs"));

        projector.Should().Contain("IsConfirmedBriefEntry");

        string apiValidator = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Validators", "ArchitectureRequestValidator.cs"));

        apiValidator.Should().Contain("PolicyPackCloudTargetMismatchEvaluator");
    }

    [Fact]
    public void TB2344_request_actors_materialize_and_security_engines_read_graph_nodes()
    {
        string materializer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "RequestActorMaterializer.cs"));

        materializer.Should().Contain("GraphNodeTypes.TrustBoundary");
        materializer.Should().Contain("TrustOrigin.External");

        string stages = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "GraphMaterializationStages.cs"));

        stages.Should().Contain("request-actors");
        stages.Should().Contain("RequestActorMaterializer.MaterializeFromActorsJson");

        string externalExposure = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ExternalExposureFindingEngine.cs"));

        externalExposure.Should().Contain("GraphNodeTypes.TrustBoundary");
        externalExposure.Should().Contain("actorNodeId");

        string request = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Requests", "ArchitectureRequest.cs"));

        request.Should().Contain("DraftActors");
    }

    [Fact]
    public void TB2345_quality_attribute_nodes_feed_dr_rpo_topology_analyzer()
    {
        string materializer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "RequestQualityAttributeMaterializer.cs"));

        materializer.Should().Contain("rtoHours");
        materializer.Should().Contain("theme");

        string stages = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "GraphMaterializationStages.cs"));

        stages.Should().Contain("request-quality-attributes");
        stages.Should().Contain("RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute");

        string analyzer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Analysis", "DrRpoTopologyAnalyzer.cs"));

        analyzer.Should().Contain("GraphNodeTypes.QualityAttribute");
        analyzer.Should().Contain("DrRpoQualityAttributeParser");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Analysis", "DrRpoQualityAttributeParser.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void TB2347_assumption_nodes_materialize_with_connector_edges()
    {
        string materializer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "RequestAssumptionMaterializer.cs"));

        materializer.Should().Contain("structured-brief");

        string edgeMaterializer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.KnowledgeGraph",
                "Materialization",
                "RequestAssumptionEdgeMaterializer.cs"));

        edgeMaterializer.Should().Contain("GraphEdgeTypes.RelatesTo");
        edgeMaterializer.Should().Contain("StructuredBriefAssumptionLink");

        string stages = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.KnowledgeGraph", "Materialization", "GraphMaterializationStages.cs"));

        stages.Should().Contain("request-assumption-edges");
        stages.Should().Contain("RequestAssumptionEdgeMaterializer.Materialize");
    }

    [Fact]
    public void TB2346_required_capability_coverage_blocks_finalize_scorecard()
    {
        string signals = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "FinalizeQualityFindingSignals.cs"));

        signals.Should().Contain("IsOpenRequiredCapabilityCoverageJobView");
        signals.Should().Contain("required-capability-coverage");

        string evaluator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "FinalizeQualityScorecardEvaluator.cs"));

        evaluator.Should().Contain("MissingRequiredCapabilityCount");
        evaluator.Should().Contain("MissingRequiredCapabilities");

        string dto = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Governance", "FinalizeQualityScorecardCountsDto.cs"));

        dto.Should().Contain("MissingRequiredCapabilityCount");
    }

    [Fact]
    public void TB2349_brief_grounding_runs_in_structural_post_processor_enricher()
    {
        string enricher = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Agents",
                "Evidence",
                "AgentProposalStructuralPostProcessorEnricher.cs"));

        enricher.Should().Contain("ApplyBriefGrounding");
        enricher.Should().Contain("StructuralGroundingDropLog");

        string postProcessor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AgentProposalStructuralPostProcessor.cs"));

        postProcessor.Should().Contain("ApplyBriefGroundingToProposal");
        postProcessor.Should().Contain("PruneRelationshipsAfterGroundingDrops");
        postProcessor.Should().Contain("IsConfirmedBriefEntry");
    }

    [Fact]
    public void Suggestion8_topology_proposals_validate_before_overlay()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Runs",
            "Orchestration",
            "AgentTopologyProposalMergeGate.cs");

        File.Exists(path).Should().BeTrue();

        string merge = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "AgentTopologyProposalGraphMerge.cs"));

        merge.Should().Contain("AgentTopologyProposalMergeGate.FilterValidatedProposals");
    }

    [Fact]
    public void Suggestion9_create_idempotency_hashes_request_body()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ArchitectureRunIdempotencyHashing.cs");
        string source = File.ReadAllText(path);

        source.Should().Contain("FingerprintRequest");
    }

    [Fact]
    public void Suggestion10_effectful_engines_and_generated_plugin_skip_set()
    {
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "ServiceCollectionExtensions.Decisioning.cs"));

        composition.Should().Contain("IEffectfulFindingEngine");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Plugins", "BuiltInFindingEngineTypeCatalog.cs"))
            .Should()
            .BeTrue();
    }
}
