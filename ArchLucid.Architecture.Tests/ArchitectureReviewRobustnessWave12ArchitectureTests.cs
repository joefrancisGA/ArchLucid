using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-12 architecture create/review robustness suggestions (111–120).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave12ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion111_decision_receipt_uses_lifecycle_guard()
    {
        string receipt = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));

        receipt.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion112_sponsor_one_pager_uses_lifecycle_guard()
    {
        string pdf = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "SponsorOnePagerPdfBuilder.cs"));

        pdf.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion113_findings_evidence_chain_and_inspect_use_lifecycle_guard()
    {
        string query = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Query",
                "RunFindingsQueryService.cs"));

        query.Should().Contain("TryBlockWhenLifecycleIncompleteAsync");
        query.Should().Contain("GetFindingEvidenceChainAsync");
        query.Should().Contain("GetFindingInspectForRunAsync");
    }

    [Fact]
    public void Suggestion114_manifest_compare_uses_complete_and_pin_guard()
    {
        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunComparePinFingerprintGuard.cs"))
            .Should()
            .BeTrue();

        string compare = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.cs"));

        compare.Should().Contain("RunComparePinFingerprintGuard");
        compare.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion115_export_and_traceability_use_lifecycle_guard()
    {
        string export = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportAuthorityMaterialLoader.cs"));

        export.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");

        string trace = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Traceability", "TraceabilityBundleBuilder.cs"));

        trace.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion116_km_identity_fallback_verifies_hash()
    {
        string access = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ArchitectureKnowledgeModelAccess.cs"));

        access.Should().Contain("VerifyAndCloneForRun");
        access.Should().Contain("TryLoadViaArchitectureIdentityAsync");
    }

    [Fact]
    public void Suggestion117_km_graph_reuse_checks_pin_fingerprints()
    {
        string reuse = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Persistence",
                "Graph",
                "GraphSnapshotCommittedReuseResolver.cs"));

        reuse.Should().Contain("GraphPinFingerprintsMatchRunHeader");

        string kmResolver = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "KnowledgeModelAwareGraphSnapshotResolver.cs"));

        kmResolver.Should().Contain("GraphPinFingerprintsMatchRunHeader");
    }

    [Fact]
    public void Suggestion118_governance_paths_require_pin_assignments()
    {
        string factory = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "RunHeaderPinnedPolicyPackAssignmentFactory.cs"));

        factory.Should().Contain("ResolveCommitTimeAssignmentsOrThrow");

        string preCommit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "PreCommitGovernanceGate.cs"));

        preCommit.Should().Contain("ResolveCommitTimeAssignmentsWithEnforcementAsync");
        preCommit.Should().NotContain("ListByScopeAsync");
    }

    [Fact]
    public void Suggestion119_replay_commit_reverifies_pins()
    {
        string commit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunCommitStage.cs"));

        commit.Should().Contain("VerifyPinIntegrityOrThrowAsync");
        commit.Should().Contain("IRunEvidencePackagePinService");
    }

    [Fact]
    public void Suggestion120_hasher_v7_and_openapi_pin_surface()
    {
        string hasher = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        hasher.Should().Contain("CreateTimePackageOrigin");

        string openApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "OpenApi",
                "PublicHttpContractSchemasOpenApiDocumentTransformer.cs"));

        openApi.Should().Contain("pinnedPolicyPackIdsJson");
        openApi.Should().Contain("pinnedEvidencePackagePinsJson");
    }
}
