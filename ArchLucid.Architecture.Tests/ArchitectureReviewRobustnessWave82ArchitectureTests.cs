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
        string ask = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "AskController.cs"));
        string askGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "AskController.SealedManifestGuard.cs"));
        string findingAsk = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "ArchitectureFindingAskController.cs"));
        string findingAskGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "ArchitectureFindingAskController.SealedManifestGuard.cs"));
        string compare = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityCompareController.cs"));
        string compareGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityCompareController.SealedManifestGuard.cs"));
        string manifestExport = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "ManifestsController.Export.cs"));
        string manifestDiagram = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Diagram.cs"));
        string manifestGet = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Manifest.cs"));
        string manifestGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.SealedManifestGuard.cs"));
        string digests = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisorySchedulingController.Digests.cs"));
        string digestsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string auditBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit", "audit-export-blocked-reason.ts"));
        string auditApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "audit-api.ts"));
        string exportRecordBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "export-record-blocked-reason.ts"));
        string artifactsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-artifacts.ts"));
        string compareDiffBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-manifest-diff-blocked-reason.ts"));
        string manifestDiff = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "resolve-architecture-manifest-json-for-diff.ts"));
        string scopedProxyBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "scoped-proxy-download-blocked-reason.ts"));
        string scopedProxyApi = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string replayBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-replay-mutation-blocked-reason.ts"));
        string exportJobs = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));

        replayBlocked.Should().Contain("comparisonReplayMutationBlockedReason");
        exportJobs.Should().Contain("comparisonReplayMutationBlockedReason");
    }
}
