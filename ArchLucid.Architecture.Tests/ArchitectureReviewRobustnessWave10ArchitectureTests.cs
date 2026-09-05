using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-10 architecture create/review robustness suggestions (91–100).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave10ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion91_findings_and_commit_require_kappa_content_pin()
    {
        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("missing create-time architecture version content hash (κ) pin");

        string commit = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "CommitOutputIntegrityService.cs"));

        commit.Should().Contain("missing create-time architecture version content hash (κ) pin");
    }

    [Fact]
    public void Suggestion92_hasher_a_v5_binds_kappa_content_hash()
    {
        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        hasher.Should().Contain("CreateTimeArchitectureVersionContentHashSha256");

        string binder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitCreateTimePinBinder.cs"));

        binder.Should().Contain("CreateTimeArchitectureVersionContentHashSha256");
    }

    [Fact]
    public void Suggestion93_graph_reuse_checks_pin_fingerprints()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "Graph", "GraphSnapshotCommittedReuseResolver.cs"));

        resolver.Should().Contain("policyPackPinsHashSha256Hex");
        resolver.Should().Contain("architectureVersionContentHashSha256Hex");

        string graphStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineGraphStage.cs"));

        graphStage.Should().Contain("PolicyPackPinsHashSha256Hex");
    }

    [Fact]
    public void Suggestion94_no_live_evidence_or_policy_fallbacks()
    {
        string loader = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Findings", "EffectfulFindingEngineEvidenceLoader.cs"));

        loader.Should().NotContain("TryGetLatestDownloadInScopeAsync");

        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("missing create-time policy pack pin JSON");
        findings.Should().NotContain("ListByScopeAsync");
    }

    [Fact]
    public void Suggestion95_knowledge_model_content_hash_pinned()
    {
        string migration = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Migrations",
                "345_RunKnowledgeModelContentHashPin.sql"));

        migration.Should().Contain("PinnedKnowledgeModelContentHashSha256");

        string pin = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunHeaderKnowledgeModelContentPin.cs"));

        pin.Should().Contain("PinnedKnowledgeModelContentHashSha256");
    }

    [Fact]
    public void Suggestion96_cross_run_prior_pin_fingerprint_guard()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Findings",
                    "CrossRunDiffFindingPriorGuard.PinFingerprints.cs"))
            .Should()
            .BeTrue();

        string prior = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "PriorReviewSnapshots.cs"));

        prior.Should().Contain("PriorPinnedEvidencePackagePinsHashSha256Hex");
    }

    [Fact]
    public void Suggestion97_shared_pin_projection_for_hashers()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Contracts",
                    "Manifest",
                    "ManifestCreateTimePinCanonicalProjection.cs"))
            .Should()
            .BeTrue();

        string hasherB = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Manifest", "GoldenManifestFingerprint.cs"));

        hasherB.Should().Contain("ManifestCreateTimePinCanonicalProjection");
    }

    [Fact]
    public void Suggestion98_compare_records_duplicate_keys()
    {
        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Comparison", "ComparisonService.cs"));

        compare.Should().Contain("DuplicateKeyConflicts");
        compare.Should().NotContain("g => g.First()");
    }

    [Fact]
    public void Suggestion99_board_export_uses_lifecycle_guard()
    {
        string export = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "ArchitectureReviewExportService.cs"));

        export.Should().Contain("AuthorityLifecycleCompareExportGuard");
        export.Should().NotContain("detail.IsCommitted");
    }

    [Fact]
    public void Suggestion100_findings_verify_policy_pack_json_byte_integrity()
    {
        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("VerifyPinIntegrityOrThrowAsync");
    }
}
