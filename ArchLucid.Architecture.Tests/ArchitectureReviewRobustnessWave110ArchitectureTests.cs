using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-110 architecture create/review robustness suggestions 1305–1316.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave110ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1305_1308_findings_export_inspect_and_evidence_chain_sealed_manifest_mappers()
    {
        string findings = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));
        string findingInspect = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingInspectController.cs"));

        findings.Should().Contain("MapProductRunQuerySealedManifestConflict");
        findingInspect.Should().Contain("MapFindingInspectSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1309_1311_finding_llm_audit_aggregate_explanation_and_pipeline_timeline_sealed_manifest_mappers()
    {
        string findingExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.FindingExplain.cs"));
        string runExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.RunExplain.cs"));
        string trail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));

        findingExplain.Should().Contain("MapExplanationSealedManifestConflict");
        runExplain.Should().Contain("MapExplanationSealedManifestConflict");
        trail.Should().Contain("MapRunQuerySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1312_1316_finding_reads_and_traceability_export_blocked_reason_wiring()
    {
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string findingInspectBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-inspect-blocked-reason.ts"));
        string evidenceChainBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "explain",
                "finding-evidence-chain-blocked-reason.ts"));
        string findingExplainBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "explain",
                "finding-explain-blocked-reason.ts"));
        string llmAuditBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-llm-audit-blocked-reason.ts"));
        string traceabilityExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-artifact-bundle.ts"));
        string traceabilityBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "traceability-bundle-export-blocked-reason.ts"));

        findingsApi.Should().Contain("findingInspectBlockedReason");
        findingsApi.Should().Contain("findingEvidenceChainBlockedReason");
        findingsApi.Should().Contain("findingExplainBlockedReason");
        findingsApi.Should().Contain("findingLlmAuditBlockedReason");
        findingInspectBlocked.Should().Contain("findingInspectBlockedReason");
        evidenceChainBlocked.Should().Contain("findingEvidenceChainBlockedReason");
        findingExplainBlocked.Should().Contain("findingExplainBlockedReason");
        llmAuditBlocked.Should().Contain("findingLlmAuditBlockedReason");
        traceabilityExport.Should().Contain("traceabilityBundleExportBlockedReason");
        traceabilityBlocked.Should().Contain("traceabilityBundleExportBlockedReason");
    }
}
