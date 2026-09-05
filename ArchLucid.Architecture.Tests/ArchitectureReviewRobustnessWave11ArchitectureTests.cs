using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-11 architecture create/review robustness suggestions (101–110).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave11ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion101_replay_prepare_reverifies_pins()
    {
        string replay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunPrepareStage.cs"));

        replay.Should().Contain("VerifyPinIntegrityOrThrowAsync");
        replay.Should().Contain("IRunEvidencePackagePinService");
    }

    [Fact]
    public void Suggestion102_findings_verify_evidence_pin_at_phi()
    {
        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("_runEvidencePackagePinService");
        findings.Should().Contain("VerifyPinIntegrityOrThrowAsync");
    }

    [Fact]
    public void Suggestion103_pinned_collection_freshness_only()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Findings",
                    "EffectfulFindingEngineCollectionFreshness.cs"))
            .Should()
            .BeTrue();

        string azure = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Findings", "OrphanedAzureResourceFindingEngine.cs"));

        azure.Should().Contain("EffectfulFindingEngineCollectionFreshness");
        azure.Should().NotContain("TryGetLatestCollectionTimestampUtcInScopeAsync");
    }

    [Fact]
    public void Suggestion104_golden_cohort_uses_pin_aware_hasher()
    {
        string cohort = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning.Tests",
                "GoldenCohortContentBaselineGeneratorTests.cs"));

        cohort.Should().Contain("ComputeContentSha256Hex(contract, createTimePins: null)");
        cohort.Should().Contain("Content_sha_changes_when_create_time_pins_present");
    }

    [Fact]
    public void Suggestion105_openapi_documents_content_hash_pins()
    {
        string openApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "OpenApi",
                "PublicHttpContractSchemasOpenApiDocumentTransformer.cs"));

        openApi.Should().Contain("pinnedArchitectureVersionContentHashSha256");
        openApi.Should().Contain("pinnedKnowledgeModelContentHashSha256");
    }

    [Fact]
    public void Suggestion106_focused_pilot_pins_in_reuse_and_hasher()
    {
        string graphStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineGraphStage.cs"));

        graphStage.Should().Contain("FocusedPilotModeEnabled");

        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("CreateTimeFocusedPilotModeEnabled");
        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
    }

    [Fact]
    public void Suggestion107_knowledge_model_load_verifies_content_hash()
    {
        string access = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ArchitectureKnowledgeModelAccess.cs"));

        access.Should().Contain("EnsurePinnedKnowledgeModelContentHashOrThrow");
    }

    [Fact]
    public void Suggestion108_findings_fail_closed_on_missing_pack_rows()
    {
        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("could not be hydrated");
        findings.Should().NotContain("continue;");
    }

    [Fact]
    public void Suggestion109_commit_governance_from_pins()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "RunHeaderPinnedPolicyPackAssignmentFactory.cs"))
            .Should()
            .BeTrue();

        string materialization = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitDecisionMaterializationStage.cs"));

        materialization.Should().Contain("RunHeaderPinnedPolicyPackAssignmentFactory");
        materialization.Should().NotContain("ListByScopeAsync");
    }

    [Fact]
    public void Suggestion110_findings_list_and_first_value_use_lifecycle_guard()
    {
        string findingsQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Query", "RunFindingsQueryService.cs"));

        findingsQuery.Should().Contain("IRunFindingsListStage");

        string firstValue = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "FirstValueReportBuilder.cs"));

        firstValue.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }
}
