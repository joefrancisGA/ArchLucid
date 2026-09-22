using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-121 architecture create/review robustness suggestions 1437–1448.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave121ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1437_1443_export_and_comparison_history_sealed_manifest_mappers()
    {
        string exports = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string exportGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.SealedManifestGuard.cs"));
        string comparisonHistory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonsController.History.cs"));
        string provenanceQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ProvenanceQueryController.SealedManifestGuard.cs"));

        exports.Should().Contain("GetRunExportHistory");
        exports.Should().Contain("GetExportRecord");
        exports.Should().Contain("MapExportReplaySealedManifestConflict");
        exportGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        exportGuard.Should().Contain("MapExportReplaySealedManifestConflict");
        comparisonHistory.Should().Contain("GetExportRecordComparisonHistory");
        comparisonHistory.Should().Contain("GetComparisonRecord");
        comparisonHistory.Should().Contain("GetComparisonSummary");
        comparisonHistory.Should().Contain("MapComparisonReplaySealedManifestConflict");
        provenanceQueryGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        provenanceQueryGuard.Should().Contain("MapProvenanceQuerySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1444_1447_export_history_authority_provenance_and_review_trail_blocked_reason_wiring()
    {
        string exportHistoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-export-history-api.ts"));
        string exportHistoryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "run-export-history-blocked-reason.ts"));
        string exportHistoryHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-export-history-query.ts"));
        string exportRecordComparisonApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-comparison-api.ts"));
        string exportRecordComparisonBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "export-record-comparison-history-blocked-reason.ts"));
        string exportRecordComparisonHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-record-comparison-history-query.ts"));
        string authorityProvenanceApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "authority-provenance-query-api.ts"));
        string authorityProvenanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "authority-provenance-alias-blocked-reason.ts"));
        string detailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "provenance", "run-provenance-blocked-reason.ts"));

        exportHistoryApi.Should().Contain("getRunExportHistory");
        exportHistoryApi.Should().Contain("runExportHistoryBlockedReason");
        exportHistoryBlocked.Should().Contain("runExportHistoryBlockedReason");
        exportHistoryHook.Should().Contain("runExportHistoryBlockedReason");
        exportRecordComparisonApi.Should().Contain("getExportRecordComparisonHistory");
        exportRecordComparisonApi.Should().Contain("exportRecordComparisonHistoryBlockedReason");
        exportRecordComparisonBlocked.Should().Contain("exportRecordComparisonHistoryBlockedReason");
        exportRecordComparisonHook.Should().Contain("exportRecordComparisonHistoryBlockedReason");
        authorityProvenanceApi.Should().Contain("getAuthorityProvenanceGraph");
        authorityProvenanceApi.Should().Contain("/v1/authority/runs/");
        authorityProvenanceApi.Should().Contain("authorityProvenanceAliasBlockedReason");
        authorityProvenanceBlocked.Should().Contain("authorityProvenanceAliasBlockedReason");
        detailArtifacts.Should().Contain("getRunProvenance");
        detailArtifacts.Should().Contain("review-trail/provenance");
        detailArtifacts.Should().Contain("runProvenanceBlockedReason");
        provenanceBlocked.Should().Contain("runProvenanceBlockedReason");
    }

    [Fact]
    public void Suggestion1448_export_history_comparison_history_and_provenance_alias_fail_closed_ux()
    {
        string exportHistoryCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailExportHistoryCallout.tsx"));
        string exportRecordComparisonCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailExportRecordComparisonHistoryCallout.tsx"));
        string graphAliasCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "GraphPageProvenanceAliasGuardCallout.tsx"));

        exportHistoryCallout.Should().Contain("run-detail-export-history-blocked");
        exportHistoryCallout.Should().Contain("useRunExportHistoryQuery");
        exportRecordComparisonCallout.Should().Contain("run-detail-export-record-comparison-history-blocked");
        exportRecordComparisonCallout.Should().Contain("useExportRecordComparisonHistoryQuery");
        graphAliasCallout.Should().Contain("graph-page-provenance-alias-blocked");
        graphAliasCallout.Should().Contain("authorityProvenanceAliasBlockedReason");
    }
}
