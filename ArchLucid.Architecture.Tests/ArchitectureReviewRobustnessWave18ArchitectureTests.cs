using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-18 architecture create/review robustness suggestions (171–180).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave18ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion171_export_receipt_matches_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));

        service.Should().Contain("ManifestDecisionReceiptExportBinder.BuildVerifiedExportReceipt");

        string binder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestDecisionReceiptExportBinder.cs"));

        binder.Should().Contain("CommittedDecisionReceiptHashSha256");

        string tests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application.Tests", "Exports", "DecisionReceiptServiceTests.cs"));

        tests.Should().Contain("BuildForRunAsync_FeasibleManifest_ReturnsReceiptMatchingSealedHash");
    }

    [Fact]
    public void Suggestion172_fail_closed_when_verdict_missing_on_export()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));

        int exportIndex = service.IndexOf("BuildForRunAsync", StringComparison.Ordinal);
        string exportBody = service[exportIndex..];

        exportBody.Should().Contain("if (verdict is null)\n            return null;");

        string tests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application.Tests", "Exports", "DecisionReceiptServiceTests.cs"));

        tests.Should().Contain("BuildForRunAsync_MissingFeasibilityVerdict_ReturnsNull");
    }

    [Fact]
    public void Suggestion173_skip_persist_persists_decision_trace()
    {
        string artifacts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Artifacts.cs"));

        int skipIndex = artifacts.IndexOf("SkipPersistingPipelineArtifacts", StringComparison.Ordinal);
        int traceIndex = artifacts.IndexOf("decisionTraceRepository.SaveAsync", StringComparison.Ordinal);

        skipIndex.Should().BeGreaterThan(0);
        traceIndex.Should().BeGreaterThan(0);
        traceIndex.Should().BeLessThan(skipIndex);

        string tests = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application.Tests",
                "Runs",
                "Finalization",
                "ManifestFinalizationServiceTests.cs"));

        tests.Should().Contain("skipPersistingPipelineArtifacts: true");
        tests.Should().Contain("Times.Once");
    }

    [Fact]
    public void Suggestion174_review_standards_snapshot_fail_closed()
    {
        string artifacts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Artifacts.cs"));

        artifacts.Should().Contain("review standards snapshot requires preloaded architecture request and findings snapshot");
        artifacts.Should().Contain("_committedReviewStandardsSnapshotCapturer.ApplyToManifest");
    }

    [Fact]
    public void Suggestion175_compare_fail_closed_on_empty_inventory()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunComparePinFingerprintGuard.cs"));

        guard.Should().Contain("committed artifact inventory hash is required for both runs");
    }

    [Fact]
    public void Suggestion176_version_string_compare_uses_facade_outcomes()
    {
        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Compare.cs"));

        compare.Should().Contain("CompareManifestVersionsAsync");
        compare.Should().Contain("MapVersionManifestCompareOutcome");

        string facade = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.cs"));

        facade.Should().Contain("CompareManifestVersionsAsync");
    }

    [Fact]
    public void Suggestion177_distinct_problem_type_for_inventory_mismatch()
    {
        string problemTypes = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "ProblemDetails", "ProblemDetailsOptions.cs"));

        problemTypes.Should().Contain("CommittedArtifactInventoryMismatch");

        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.cs"));

        controller.Should().Contain("ProblemTypes.CommittedArtifactInventoryMismatch");
    }

    [Fact]
    public void Suggestion178_recovery_verifies_sealed_receipt_hash()
    {
        string verifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        verifier.Should().Contain("EnsureDecisionReceiptHashConsistentOrThrow");

        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("EnsureDecisionReceiptHashConsistentOrThrow");
    }

    [Fact]
    public void Suggestion179_in_memory_finding_properties_stay_synced()
    {
        string converter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Findings",
                "Serialization",
                "FindingJsonConverter.cs"));

        converter.Should().Contain("value.Properties[FindingPropertyKeys.EvidencePackageId]");
    }

    [Fact]
    public void Suggestion180_scope_assert_messages_match_operation_kind()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunScopeAssertionGuard.cs"));

        guard.Should().Contain("operationLabel");

        string hosted = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Async",
                "ArchitectureRunAsyncOperationHostedService.cs"));

        int createIndex = hosted.IndexOf("ArchitectureRunAsyncOperationKind.Create", StringComparison.Ordinal);
        int executeIndex = hosted.IndexOf("ArchitectureRunAsyncOperationKind.Execute", StringComparison.Ordinal);

        hosted.IndexOf("RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow", createIndex, StringComparison.Ordinal)
            .Should()
            .BeGreaterThan(createIndex);
        hosted.IndexOf("\"Create\"", createIndex, StringComparison.Ordinal).Should().BeGreaterThan(createIndex);
        hosted.IndexOf("RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow", executeIndex, StringComparison.Ordinal)
            .Should()
            .BeGreaterThan(executeIndex);
        hosted.IndexOf("\"Execute\"", executeIndex, StringComparison.Ordinal).Should().BeGreaterThan(executeIndex);
    }
}
