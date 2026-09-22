using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-107 architecture create/review robustness suggestions 1269–1280.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave107ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1269_1272_remediation_audit_precommit_and_trace_forensics_sealed_manifest_mappers()
    {
        string remediation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.cs"));
        string auditDownload = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Download.cs"));
        string auditCsv = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Csv.cs"));
        string preCommit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.cs"));
        string traceForensics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.cs"));

        remediation.Should().Contain("MapFindingRemediationAssignmentSealedManifestConflict");
        auditDownload.Should().Contain("MapAuditExportSealedManifestConflict");
        auditCsv.Should().Contain("MapAuditExportSealedManifestConflict");
        preCommit.Should().Contain("MapPreCommitSimulationSealedManifestConflict");
        traceForensics.Should().Contain("MapTraceForensicsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1273_1275_run_events_governance_dry_run_and_finding_mute_sealed_manifest_mappers()
    {
        string runEvents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.cs"));
        string dryRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PolicyPacks.DryRun.cs"));
        string findingMute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingMuteController.cs"));
        string findingUnmute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingMuteController.Unmute.cs"));

        runEvents.Should().Contain("MapRunEventsSealedManifestConflict");
        dryRun.Should().Contain("MapGovernanceSealedManifestConflict");
        findingMute.Should().Contain("MapFindingMuteSealedManifestConflict");
        findingUnmute.Should().Contain("MapFindingMuteSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1276_1280_unmute_pre_finalize_and_agent_forensics_blocked_reason_wiring()
    {
        string unmuteClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-unmute-client.ts"));
        string unmuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-unmute-mutation-blocked-reason.ts"));
        string preFinalizeApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "pre-finalize-checklist.ts"));
        string preFinalizeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "pre-finalize-checklist-blocked-reason.ts"));
        string artifactsApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "architecture-runs-read-detail-artifacts.ts"));
        string forensicsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-agent-forensics-blocked-reason.ts"));

        unmuteClient.Should().Contain("findingUnmuteMutationBlockedReason");
        unmuteBlocked.Should().Contain("findingUnmuteMutationBlockedReason");
        preFinalizeApi.Should().Contain("preFinalizeChecklistBlockedReason");
        preFinalizeBlocked.Should().Contain("preFinalizeChecklistBlockedReason");
        artifactsApi.Should().Contain("runAgentForensicsBlockedReason");
        forensicsBlocked.Should().Contain("runAgentForensicsBlockedReason");
    }
}
