using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-28 architecture create/review robustness suggestions (281–310 stretch batch).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave28ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion281_282_governance_disposition_fail_closed_on_sealed_hash()
    {
        string dispositions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.Dispositions.cs"));

        dispositions.Should().Contain("GovernanceDispositionSealedManifestGuard");
        dispositions.Should().Contain("RecordDispositionAsync");
        dispositions.Should().Contain("RecordBulkDispositionAsync");
    }

    [Fact]
    public void Suggestion283_284_compare_run_pair_fail_closed_on_sealed_hash()
    {
        string pairLoad = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "CompareRunsApplicationFacade.PairLoad.cs"));
        string manifestCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "CompareRunsApplicationFacade.ManifestCompare.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsSealedManifestHashGuard.cs"));

        pairLoad.Should().Contain("CompareRunsSealedManifestHashGuard");
        manifestCompare.Should().Contain("CompareRunsSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion285_286_compare_api_maps_sealed_manifest_hash_mismatch()
    {
        string holistic = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));
        string comparison = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.cs"));

        holistic.Should().Contain("ManifestCompareLoadOutcome.SealedManifestHashMismatch");
        comparison.Should().Contain("ManifestCompareLoadOutcome.SealedManifestHashMismatch");
    }

    [Fact]
    public void Suggestion287_authority_manifest_id_compare_fail_closed_on_sealed_hash()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityCompareController.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "AuthorityManifestIdCompareSealedManifestHashGuard.cs"));

        controller.Should().Contain("AuthorityManifestIdCompareSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion288_findings_csv_export_fail_closed_on_sealed_hash()
    {
        string csv = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Query",
                "Stages",
                "RunFindingsCsvExportStage.cs"));

        csv.Should().Contain("RunExportSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion289_commit_sponsor_email_dispatch_reverify_sealed_hash()
    {
        string notifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Notifications",
                "Email",
                "CommitSponsorEmailNotifier.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Notifications",
                "Email",
                "CommitSponsorEmailDispatchSealedManifestHashGuard.cs"));

        notifier.Should().Contain("CommitSponsorEmailDispatchSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion290_advisory_apply_fail_closed_on_sealed_hash()
    {
        string apply = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryWorkflowFacade.Apply.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryApplySealedManifestHashGuard.cs"));

        apply.Should().Contain("AdvisoryApplySealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion291_advisory_digest_read_fail_closed_on_sealed_hash()
    {
        string digests = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisorySchedulingController.Digests.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryDigestReadSealedManifestHashGuard.cs"));

        digests.Should().Contain("AdvisoryDigestReadSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion292_batch_replay_pin_inventory_guard_handles_sealed_hash_mismatch()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ComparisonBatchReplayPinInventoryGuard.cs"));

        guard.Should().Contain("ScopedRunPairLoadOutcome.SealedManifestHashMismatch");
    }

    [Fact]
    public void Suggestion293_297_run_integration_event_manifest_hash_metadata()
    {
        string resolver = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integration",
                "RunIntegrationEventManifestHashResolver.cs"));
        string findings = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "FindingsIntegrationEventPublishing.cs"));
        string governance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Workflow",
                "Stages",
                "GovernanceWorkflowIntegrationEventSupport.cs"));

        resolver.Should().Contain("TryResolveVerifiedManifestHashAsync");
        findings.Should().Contain("RunIntegrationEventManifestHashResolver");
        findings.Should().Contain("manifestHash");
        governance.Should().Contain("RunIntegrationEventManifestHashResolver");
        governance.Should().Contain("manifestHash");
    }

    [Fact]
    public void Suggestion298_299_outbox_guard_includes_wave28_run_scoped_event_types()
    {
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));

        outboxGuard.Should().Contain("IntegrationEventTypes.FindingsHighSeverityCapturedV1");
        outboxGuard.Should().Contain("IntegrationEventTypes.GovernanceApprovalSubmittedV1");
        outboxGuard.Should().Contain("IntegrationEventTypes.GovernancePromotionActivatedV1");
    }

    [Fact]
    public void Suggestion300_310_ui_run_collateral_clipboard_export_fail_closed()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-collateral-sealed-manifest-guard.ts"));
        string copyManifest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CopyManifestButton.tsx"));
        string copyAi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CopyForAiAssistantButton.tsx"));

        guard.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        copyManifest.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        copyAi.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }
}
