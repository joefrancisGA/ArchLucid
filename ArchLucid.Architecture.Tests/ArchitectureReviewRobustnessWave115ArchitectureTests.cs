using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-115 architecture create/review robustness suggestions 1365–1376.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave115ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1365_1368_sponsor_summary_and_run_package_export_sealed_manifest_mappers()
    {
        string architectureExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArchitectureExportController.cs"));
        string architectureExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArchitectureExportController.SealedManifestGuard.cs"));
        string runsExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsExportController.cs"));
        string runsExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsExportController.SealedManifestGuard.cs"));

        architectureExport.Should().Contain("MapArchitectureExportSealedManifestConflict");
        architectureExport.Should().Contain("ExportRunSummary");
        architectureExportGuard.Should().Contain("MapArchitectureExportSealedManifestConflict");
        runsExport.Should().Contain("MapRunsExportSealedManifestConflict");
        runsExportGuard.Should().Contain("MapRunsExportSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1369_1371_run_summary_sse_and_summary_read_sealed_manifest_mappers()
    {
        string runEvents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.cs"));
        string runEventsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.SealedManifestGuard.cs"));
        string runDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));

        runEvents.Should().Contain("MapRunEventsSealedManifestConflict");
        runEvents.Should().Contain("GetRunEvents");
        runEventsGuard.Should().Contain("MapRunEventsSealedManifestConflict");
        runDetail.Should().Contain("MapRunQuerySealedManifestConflict");
        runDetail.Should().Contain("GetRunSummary");
    }

    [Fact]
    public void Suggestion1372_1376_sponsor_summary_export_anchor_and_blocked_reason_wiring()
    {
        string summaryExportApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-summary-export-api.ts"));
        string summaryExportDownload = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-run-summary-export.ts"));
        string downloadUrls = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-urls.ts"));
        string summaryExportBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-summary-export-mutation-blocked-reason.ts"));
        string pageHeader = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPageHeader.tsx"));
        string apiIndex = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "index.ts"));

        summaryExportApi.Should().Contain("downloadRunSummaryExport");
        summaryExportApi.Should().Contain("getRunSummaryExportUrl");
        summaryExportApi.Should().Contain("runSummaryExportMutationBlockedReason");
        summaryExportDownload.Should().Contain("runSummaryExportMutationBlockedReason");
        summaryExportDownload.Should().Contain("getRunSummaryExportUrl");
        summaryExportDownload.Should().Contain("downloadScopedProxyFileGet");
        downloadUrls.Should().Contain("getRunSummaryExportUrl");
        summaryExportBlocked.Should().Contain("runSummaryExportMutationBlockedReason");
        pageHeader.Should().Contain("downloadRunSummaryExport");
        pageHeader.Should().Contain("runSummaryExportMutationBlockedReason");
        pageHeader.Should().Contain("run-summary-export-api");
        apiIndex.Should().Contain("run-summary-export-api");
    }
}
