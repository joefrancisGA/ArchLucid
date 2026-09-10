using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-82 architecture create/review robustness suggestions 969–980.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave82ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion969_975_ask_finding_compare_manifest_and_digest_openapi_409()
    {
        string ask = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "AskController.cs"));
        string askGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "AskController.SealedManifestGuard.cs"));
        string findingAsk = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "ArchitectureFindingAskController.cs"));
        string findingAskGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "ArchitectureFindingAskController.SealedManifestGuard.cs"));
        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityCompareController.cs"));
        string compareGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityCompareController.SealedManifestGuard.cs"));
        string manifestExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Export.cs"));
        string manifestDiagram = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Diagram.cs"));
        string manifestGet = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Manifest.cs"));
        string manifestGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.SealedManifestGuard.cs"));
        string digests = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisorySchedulingController.Digests.cs"));
        string digestsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisorySchedulingController.SealedManifestGuard.cs"));

        ask.Should().Contain("MapAskSealedManifestConflict");
        askGuard.Should().Contain("MapAskSealedManifestConflict");
        findingAsk.Should().Contain("MapFindingAskSealedManifestConflict");
        findingAskGuard.Should().Contain("MapFindingAskSealedManifestConflict");
        compare.Should().Contain("MapCompareSealedManifestConflict");
        compareGuard.Should().Contain("MapCompareSealedManifestConflict");
        manifestExport.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        manifestDiagram.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        manifestGet.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        manifestGuard.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        manifestGuard.Should().Contain("GoldenManifestReadConflictProblem");
        digests.Should().Contain("MapDigestSealedManifestConflict");
        digestsGuard.Should().Contain("MapDigestSealedManifestConflict");
    }

    [Fact]
    public void Suggestion976_979_audit_artifact_compare_diff_and_scoped_proxy_blocked_reason_wiring()
    {
        string auditBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit", "audit-export-blocked-reason.ts"));
        string auditApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "audit-api.ts"));
        string exportRecordBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "export-record-blocked-reason.ts"));
        string artifactsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-artifacts.ts"));
        string compareDiffBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-manifest-diff-blocked-reason.ts"));
        string manifestDiff = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "resolve-architecture-manifest-json-for-diff.ts"));
        string scopedProxyBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "scoped-proxy-download-blocked-reason.ts"));
        string scopedProxyApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-scoped-proxy.ts"));

        auditBlocked.Should().Contain("auditExportBlockedReason");
        auditApi.Should().Contain("auditExportBlockedReason");
        exportRecordBlocked.Should().Contain("exportRecordBlockedReason");
        artifactsApi.Should().Contain("exportRecordBlockedReason");
        compareDiffBlocked.Should().Contain("compareManifestDiffBlockedReason");
        manifestDiff.Should().Contain("compareManifestDiffBlockedReason");
        scopedProxyBlocked.Should().Contain("scopedProxyDownloadBlockedReason");
        scopedProxyApi.Should().Contain("scopedProxyDownloadBlockedReason");
    }

    [Fact]
    public void Suggestion980_comparison_replay_pdf_blocked_reason_wiring()
    {
        string replayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-replay-mutation-blocked-reason.ts"));
        string exportJobs = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));

        replayBlocked.Should().Contain("comparisonReplayMutationBlockedReason");
        exportJobs.Should().Contain("comparisonReplayMutationBlockedReason");
    }
}
