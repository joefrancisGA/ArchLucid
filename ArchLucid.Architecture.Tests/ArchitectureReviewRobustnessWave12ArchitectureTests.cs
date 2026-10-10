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
        string receipt = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/DecisionReceiptService.cs");

        receipt.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion112_sponsor_one_pager_uses_lifecycle_guard()
    {
        string pdf = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Pilots/SponsorOnePagerPdfBuilder.cs");

        pdf.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion113_findings_evidence_chain_and_inspect_use_lifecycle_guard()
    {
        string query = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Query/RunFindingsQueryService.cs");

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

        string compare = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsApplicationFacade.cs");

        compare.Should().Contain("RunComparePinFingerprintGuard");
        compare.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion115_export_and_traceability_use_lifecycle_guard()
    {
        string export = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/RunExportAuthorityMaterialLoader.cs");

        export.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");

        string trace = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Traceability/TraceabilityBundleBuilder.cs");

        trace.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
    }

    [Fact]
    public void Suggestion116_km_identity_fallback_verifies_hash()
    {
        string access = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/ArchitectureIntelligence/ArchitectureKnowledgeModelAccess.cs");

        access.Should().Contain("VerifyAndCloneForRun");
        access.Should().Contain("TryLoadViaArchitectureIdentityAsync");
    }

    [Fact]
    public void Suggestion117_km_graph_reuse_checks_pin_fingerprints()
    {
        string reuse = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Core/Persistence/Graph/GraphSnapshotCommittedReuseResolver.cs");

        reuse.Should().Contain("GraphPinFingerprintsMatchRunHeader");

        string kmResolver = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Orchestration/Pipeline/KnowledgeModelAwareGraphSnapshotResolver.cs");

        kmResolver.Should().Contain("GraphPinFingerprintsMatchRunHeader");
    }

    [Fact]
    public void Suggestion118_governance_paths_require_pin_assignments()
    {
        string factory = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/RunHeaderPinnedPolicyPackAssignmentFactory.cs");

        factory.Should().Contain("ResolveCommitTimeAssignmentsOrThrow");

        string preCommit = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Governance/PreCommitGovernanceGate.cs");

        preCommit.Should().Contain("ResolveCommitTimeAssignmentsWithEnforcementAsync");
        preCommit.Should().NotContain("ListByScopeAsync");
    }

    [Fact]
    public void Suggestion119_replay_commit_reverifies_pins()
    {
        string commit = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Replay/ReplayRunCommitStage.cs");

        commit.Should().Contain("VerifyPinIntegrityOrThrowAsync");
        commit.Should().Contain("IRunEvidencePackagePinService");
    }

    [Fact]
    public void Suggestion120_hasher_v7_and_openapi_pin_surface()
    {
        string hasher = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Decisioning/Services/ManifestHashService.cs");

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        hasher.Should().Contain("CreateTimePackageOrigin");

        string openApi = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/OpenApi/PublicHttpContractSchemasOpenApiDocumentTransformer.cs");

        openApi.Should().Contain("pinnedPolicyPackIdsJson");
        openApi.Should().Contain("pinnedEvidencePackagePinsJson");
    }
}
