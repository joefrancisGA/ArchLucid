using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-19 architecture create/review robustness suggestions (181–190).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave19ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    private static string ReadCompareRunsFacadeSources() =>
        string.Join(
            '\n',
            Directory.GetFiles(
                    Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis"),
                    "CompareRunsApplicationFacade*.cs")
                .OrderBy(static path => path, StringComparer.Ordinal)
                .Select(File.ReadAllText));

    [Fact]
    public void Suggestion181_export_receipt_mismatch_fail_closed()
    {
        string problemTypes = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "ProblemDetails", "ProblemDetailsOptions.cs"));

        problemTypes.Should().Contain("DecisionReceiptSealedHashMismatch");

        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));

        download.Should().Contain("DecisionReceiptRunBuildOutcome.SealedHashMismatch");
        download.Should().Contain("ProblemTypes.DecisionReceiptSealedHashMismatch");

        string tests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application.Tests", "Exports", "DecisionReceiptServiceTests.cs"));

        tests.Should().Contain("BuildForRunAsync_SealedReceiptHashMismatch_ReturnsSealedHashMismatch");
    }

    [Fact]
    public void Suggestion182_export_binds_verdict_and_version_from_sealed_document()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));

        int exportIndex = service.IndexOf("BuildForRunAsync", StringComparison.Ordinal);
        string exportBody = service[exportIndex..];

        exportBody.Should().Contain("compareDetail.GoldenManifest.FeasibilityVerdict");
        exportBody.Should().Contain("compareDetail.GoldenManifest.Metadata?.Version");
        exportBody.Should().NotContain("GetManifestSummaryAsync");
    }

    [Fact]
    public void Suggestion183_zip_export_verifies_sealed_receipt_hash()
    {
        string loader = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportAuthorityMaterialLoader.cs"));

        loader.Should().Contain("BuildVerifiedExportReceipt");
        loader.Should().Contain("SealedReceiptHashMismatch");
    }

    [Fact]
    public void Suggestion184_version_compare_emits_input_fingerprints()
    {
        string facade = ReadCompareRunsFacadeSources();

        facade.Should().Contain("InputFingerprints = RunComparePinFingerprintGuard.BuildCompareInputFingerprints");

        string diff = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Diffs", "ManifestDiffResult.cs"));

        diff.Should().Contain("CompareInputFingerprints? InputFingerprints");

        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Compare.cs"));

        compare.Should().Contain("BuildVersionCompareDiff");
    }

    [Fact]
    public void Suggestion185_version_compare_diffs_inventory_checked_document()
    {
        string facade = ReadCompareRunsFacadeSources();

        facade.Should().Contain("ProjectCompareManifestAsync(leftDetail.GoldenManifest");
        facade.Should().Contain("IAuthorityCommitProjectionBuilder");
    }

    [Fact]
    public void Suggestion186_pin_fingerprints_fail_closed_when_empty()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunComparePinFingerprintGuard.cs"));

        guard.Should().Contain("create-time {label} is required for both runs");
    }

    [Fact]
    public void Suggestion187_agent_compare_enforces_pin_and_inventory_fingerprints()
    {
        string facade = ReadCompareRunsFacadeSources();

        int loadIndex = facade.IndexOf("LoadScopedRunPairAsync", StringComparison.Ordinal);
        string loadBody = facade[loadIndex..];

        loadBody.Should().Contain("EnsureCreateTimePinFingerprintsMatchOrThrow");
        loadBody.Should().Contain("EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow");

        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Agents.cs"));

        controller.Should().Contain("ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch");
    }

    [Fact]
    public void Suggestion188_recovery_verifies_manifest_hash_without_mutating_receipt()
    {
        string verifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        verifier.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");

        string scratch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestDocumentHashScratch.cs"));

        scratch.Should().Contain("WithCommittedDecisionReceiptHashCleared");
    }

    [Fact]
    public void Suggestion189_commit_and_finalize_assert_caller_scope()
    {
        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow");
        orchestrator.Should().Contain("\"Commit\"");

        string finalization = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Finalization", "ManifestFinalizationService.cs"));

        finalization.Should().Contain("RunScopeAssertionGuard.EnsureCallerScopeMatchesRunOrThrow");
        finalization.Should().Contain("\"Finalize\"");
    }

    [Fact]
    public void Suggestion190_finding_enforcement_tier_and_read_path_property_sync()
    {
        string converter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Findings",
                "Serialization",
                "FindingJsonConverter.cs"));

        converter.Should().Contain("FindingPropertyKeys.EnforcementTier");
        converter.Should().Contain("findingId is required");
    }
}
