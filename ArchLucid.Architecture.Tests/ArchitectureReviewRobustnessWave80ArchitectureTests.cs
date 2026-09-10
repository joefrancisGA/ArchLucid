using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-80 architecture create/review robustness suggestions 945–956.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave80ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion945_951_forensics_events_coverage_evaluation_manifest_and_provenance_openapi_409()
    {
        string traceForensics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.cs"));
        string traceForensicsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.SealedManifestGuard.cs"));
        string runEvents = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityRunEventsController.cs"));
        string runEventsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.SealedManifestGuard.cs"));
        string runCoverage = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunCoverageController.cs"));
        string runCoverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));
        string runCoverageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.SealedManifestGuard.cs"));
        string agentEvaluation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.cs"));
        string agentEvaluationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.SealedManifestGuard.cs"));
        string authorityTrail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.Trail.cs"));
        string authorityQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.SealedManifestGuard.cs"));
        string productPublish = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.ProductPublish.cs"));
        string architectureIntelligenceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.SealedManifestGuard.cs"));
        string readHandlers = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "AuthorityRunReadHandlers.cs"));
        string readHandlersGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Support", "AuthorityRunReadHandlers.SealedManifestGuard.cs"));

        traceForensics.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        traceForensicsGuard.Should().Contain("SealedManifestReadGuard");
        runEvents.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        runEventsGuard.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        runCoverage.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runCoverageAck.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runCoverageGuard.Should().Contain("SealedManifestReadGuard");
        agentEvaluation.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        agentEvaluationGuard.Should().Contain("SealedManifestReadGuard");
        authorityTrail.Should().Contain("EnsureManifestSummarySealedReadAllowed");
        authorityQueryGuard.Should().Contain("EnsureManifestSummarySealedReadAllowed");
        productPublish.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        architectureIntelligenceGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        readHandlers.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        readHandlersGuard.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
    }

    [Fact]
    public void Suggestion952_955_mermaid_ask_diagram_reconcile_and_snapshots_blocked_reason_wiring()
    {
        string mermaidBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-mermaid-mutation-blocked-reason.ts"));
        string mermaidApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-mermaid-api.ts"));
        string askApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-ask-api.ts"));
        string diagramReconcileApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-diagram-reconcile-api.ts"));
        string snapshotsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-snapshots-load-blocked-reason.ts"));
        string driftApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-drift-api.ts"));

        mermaidBlocked.Should().Contain("infraEvidenceMermaidMutationBlockedReason");
        mermaidApi.Should().Contain("infraEvidenceMermaidMutationBlockedReason");
        askApi.Should().Contain("infraEvidenceAskBlockedReason");
        diagramReconcileApi.Should().Contain("diagramReconcileLoadModelBlockedReason");
        diagramReconcileApi.Should().Contain("diagramIngestMutationBlockedReason");
        diagramReconcileApi.Should().Contain("diagramReconcileMutationBlockedReason");
        snapshotsBlocked.Should().Contain("infraEvidenceSnapshotsLoadBlockedReason");
        driftApi.Should().Contain("infraEvidenceSnapshotsLoadBlockedReason");
    }

    [Fact]
    public void Suggestion956_manifest_summary_read_blocked_reason_wiring()
    {
        string manifestSummaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "manifest-summary-read-blocked-reason.ts"));
        string manifestDetailErrors = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "sealed-records",
                "[manifestId]",
                "_sections",
                "ManifestDetailPageErrorViews.tsx"));
        string enrichRows = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "sealed-records",
                "_sections",
                "enrich-signed-records-list-rows.ts"));

        manifestSummaryBlocked.Should().Contain("manifestSummaryReadBlockedReason");
        manifestDetailErrors.Should().Contain("manifestSummaryReadBlockedReason");
        enrichRows.Should().Contain("manifestSummaryReadBlockedReason");
    }
}
