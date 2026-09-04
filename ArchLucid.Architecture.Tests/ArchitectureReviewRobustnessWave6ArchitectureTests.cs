using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-6 architecture create/review robustness suggestions (51–60).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave6ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion51_evidence_pin_persisted_on_run_header()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"))
            .Should()
            .BeTrue();

        string sql = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations", "343_RunCreatePinsWave6.sql"));

        sql.Should().Contain("PinnedEvidencePackagePinsJson");
        sql.Should().Contain("@runTable");
        sql.Should().NotMatchRegex(@"(?m)^\s*ALTER\s+TABLE\s+dbo\.Runs\b");

        string bootstrapSql = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql"));

        bootstrapSql.Should().Contain("PinnedEvidencePackagePinsJson");
        bootstrapSql.Should().Contain("@wave6PinRunTable");
    }

    [Fact]
    public void Suggestion52_commit_requires_policy_pack_pin_hash()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunPolicyPackPinService.cs"));

        pinService.Should().Contain("run is missing a policy pack pin hash");
    }

    [Fact]
    public void Suggestion53_focused_pilot_restored_from_run_header()
    {
        string scopePin = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunGovernanceScopePinService.cs"));

        scopePin.Should().Contain("PinnedFocusedPilotModeEnabled");
        scopePin.Should().Contain("BeginRestoredScope");

        string executor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "AuthorityPipelineStagesExecutor.cs"));

        executor.Should().Contain("BeginRestoredScope");
    }

    [Fact]
    public void Suggestion54_cross_run_prior_graph_fail_closed()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Findings",
                "CrossRunDiffFindingPriorGuard.cs"));

        guard.Should().Contain("EnsurePriorGraphLoadedOrThrow");
    }

    [Fact]
    public void Suggestion55_multi_cloud_evidence_pins_on_context()
    {
        string context = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "FindingAnalysisContext.cs"));

        context.Should().Contain("EvidencePins");

        string loader = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Findings",
                "EffectfulFindingEngineEvidenceLoader.cs"));

        loader.Should().Contain("RunEvidencePackagePinService.AwsProvider");
        loader.Should().Contain("RunEvidencePackagePinService.GcpProvider");
    }

    [Fact]
    public void Suggestion56_commit_reverifies_architecture_version_kappa()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Architecture",
                    "ArchitectureVersionContentFingerprintVerifier.cs"))
            .Should()
            .BeTrue();

        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("ArchitectureVersionContentFingerprintVerifier");
    }

    [Fact]
    public void Suggestion57_manifest_hasher_v3_binds_create_time_pins()
    {
        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("CreateTimePolicyPackPins");
        hasher.Should().Contain("CreateTimeEvidencePackagePins");
    }

    [Fact]
    public void Suggestion58_lifecycle_phase_on_list_and_compare_guard()
    {
        string runSummary = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "RunSummary.cs"));

        runSummary.Should().Contain("AuthorityLifecyclePhase");

        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "AuthorityLifecycleCompareExportGuard.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion59_replay_blocks_four_agent_when_stage_outcomes_exist()
    {
        string replay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunExecutePreparedStage.cs"));

        replay.Should().Contain("SourceRunHasAuthorityStageProgressAsync");
        replay.Should().Contain("four-agent / DecisionEngineV2 replay is not permitted");
    }

    [Fact]
    public void Suggestion60_legacy_string_array_pack_pin_removed()
    {
        string builder = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        builder.Should().Contain("RunHeaderPinDeserializer.TryDeserializePolicyPackRows");
        builder.Should().NotContain("Deserialize<string[]>");
    }
}
