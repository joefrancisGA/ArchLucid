using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-17 architecture create/review robustness suggestions (161–170).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave17ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion161_receipt_hash_sealed_after_governance_and_review_snapshots()
    {
        string artifacts = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Finalization/ManifestFinalizationService.Artifacts.cs");

        int governanceIndex = artifacts.IndexOf("_committedEffectiveGovernanceSnapshotCapturer.ApplyToManifestAsync", StringComparison.Ordinal);
        int reviewIndex = artifacts.IndexOf("_committedReviewStandardsSnapshotCapturer.ApplyToManifest", StringComparison.Ordinal);
        int receiptIndex = artifacts.IndexOf("ManifestDecisionReceiptHashCapturer.ApplyToManifest", StringComparison.Ordinal);

        governanceIndex.Should().BeGreaterThan(0);
        reviewIndex.Should().BeGreaterThan(governanceIndex);
        receiptIndex.Should().BeGreaterThan(reviewIndex);
    }

    [Fact]
    public void Suggestion162_fail_closed_when_feasibility_verdict_missing()
    {
        string capturer = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Finalization/ManifestDecisionReceiptHashCapturer.cs");

        capturer.Should().Contain("feasibility verdict is required");
        capturer.Should().NotContain("if (verdict is null)\n            return;");
    }

    [Fact]
    public void Suggestion163_export_receipts_for_all_sealed_committed_runs()
    {
        string service = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/DecisionReceiptService.cs");

        int runExportIndex = service.IndexOf("BuildForRunAsync", StringComparison.Ordinal);
        runExportIndex.Should().BeGreaterThan(0);

        string runExportBody = service[runExportIndex..];
        runExportBody.Should().NotContain("IsExportableVerdict");

        string tests = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application.Tests/Exports/DecisionReceiptServiceTests.cs");

        tests.Should().Contain("BuildForRunAsync_FeasibleManifest_ReturnsReceiptMatchingSealedHash");
    }

    [Fact]
    public void Suggestion164_version_string_compare_enforces_inventory_fingerprints()
    {
        string compare = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Governance/ManifestsController.Compare.cs");

        compare.Should().Contain("CompareManifestVersionsAsync");

        string facade = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsApplicationFacade.cs");

        facade.Should().Contain("EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow");
        facade.Should().Contain("GetRunDetailForManifestCompareAsync");
    }

    [Fact]
    public void Suggestion165_compare_fail_closed_when_run_headers_missing()
    {
        string facade = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsApplicationFacade.cs");

        facade.Should().Contain("if (baseHeader is null)");
        facade.Should().Contain("if (targetHeader is null)");
        facade.Should().NotContain("if (baseHeader is not null && targetHeader is not null)");
    }

    [Fact]
    public void Suggestion166_distinct_outcome_for_inventory_mismatch()
    {
        string outcomes = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsResults.cs");

        outcomes.Should().Contain("CommittedArtifactInventoryMismatch");

        string controller = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Planning/ComparisonController.cs");

        controller.Should().Contain("ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch");
    }

    [Fact]
    public void Suggestion167_skip_persist_persists_sealed_manifest_body()
    {
        string artifacts = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Finalization/ManifestFinalizationService.Artifacts.cs");

        int skipIndex = artifacts.IndexOf("SkipPersistingPipelineArtifacts", StringComparison.Ordinal);
        int saveIndex = artifacts.IndexOf("goldenManifestRepository.SaveAsync", skipIndex, StringComparison.Ordinal);

        skipIndex.Should().BeGreaterThan(0);
        saveIndex.Should().BeGreaterThan(skipIndex);

        string tests = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application.Tests/Runs/Finalization/ManifestFinalizationServiceTests.cs");

        tests.Should().Contain("skipPersistingPipelineArtifacts: true");
        tests.Should().Contain("Times.Once");
    }

    [Fact]
    public void Suggestion168_recovery_and_finalize_share_decision_trace_mapper_bytes()
    {
        string factory = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Finalization/ManifestCommittedArtifactInventoryMaterialFactory.cs");

        factory.Should().Contain("DecisionTraceRecordMapper.ToDto(request.Trace)");

        string recovery = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Finalization/ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.cs");

        recovery.Should().Contain("DecisionTraceRecordMapper.ToDomain(traceDto)");
        recovery.Should().Contain("DecisionTraceRecordMapper.ToDto");
    }

    [Fact]
    public void Suggestion169_evidence_package_id_synced_with_properties_bag()
    {
        string converter = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Core/Findings/Serialization/FindingJsonConverter.cs");

        converter.Should().Contain("FindingPropertyKeys.EvidencePackageId");

        string tests = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Core.Tests/Findings/Serialization/FindingJsonConverterTests.cs");

        tests.Should().Contain("RoundTrip_syncsEvidencePackageIdWithPropertiesBag");
    }

    [Fact]
    public void Suggestion170_async_create_asserts_caller_scope()
    {
        string hosted = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Runs/Async/ArchitectureRunAsyncOperationHostedService.cs");

        int createIndex = hosted.IndexOf("ArchitectureRunAsyncOperationKind.Create", StringComparison.Ordinal);
        int scopeIndex = hosted.IndexOf("ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow", createIndex, StringComparison.Ordinal);

        createIndex.Should().BeGreaterThan(0);
        scopeIndex.Should().BeGreaterThan(createIndex);
    }

    [Fact]
    public void Suggestion161_162_167_hasher_v12_baseline()
    {
        string hasher = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Decisioning/Services/ManifestHashService.cs");

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");

        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "tests",
                    "manifest-hash",
                    "hasher-baseline-v12.json"))
            .Should()
            .BeTrue();
    }
}
