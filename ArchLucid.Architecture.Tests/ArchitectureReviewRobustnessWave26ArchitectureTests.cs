using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-26 architecture create/review robustness suggestions (251–280 subset).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave26ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion251_252_pre_finalize_checklist_and_simulation_fail_closed_on_sealed_hash()
    {
        string controller = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PreCommitSimulationSealedManifestHashGuard.cs"));

        controller.Should().Contain("PreCommitSimulationSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion253_254_governance_preview_fail_closed_on_sealed_hash()
    {
        string service = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Preview",
                "GovernancePreviewService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Preview",
                "GovernancePreviewSealedManifestHashGuard.cs"));

        service.Should().Contain("GovernancePreviewSealedManifestHashGuard");
        guard.Should().Contain("ManifestGoldenReadSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion255_recurrence_schedule_create_fail_closed_on_source_run_sealed_hash()
    {
        string recurrence = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Recurrence.cs"));

        recurrence.Should().Contain("RecurrenceScheduleCreateSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion256_draft_snapshot_clone_fail_closed_on_spawned_run_sealed_hash()
    {
        string cloning = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftSnapshotCloningService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftSnapshotCloneSealedManifestHashGuard.cs"));

        cloning.Should().Contain("DraftSnapshotCloneSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion257_authority_replay_fail_closed_before_rebuild()
    {
        string replay = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Coordination", "Replay", "AuthorityReplayService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Coordination",
                "Replay",
                "AuthorityReplaySealedManifestHashGuard.cs"));

        replay.Should().Contain("AuthorityReplaySealedManifestHashGuard");
        guard.Should().Contain("ComputeHash");
    }

    [Fact]
    public void Suggestion258_replay_prepare_fail_closed_before_clone_side_effects()
    {
        string prepare = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunPrepareStage.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunPrepareSealedManifestHashGuard.cs"));

        prepare.Should().Contain("ReplayRunPrepareSealedManifestHashGuard");
        guard.Should().Contain("ReplayRunSourceSealedManifestPinGuard");
    }

    [Fact]
    public void Suggestion262_alert_delivery_fail_closed_on_run_sealed_hash()
    {
        string dispatcher = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertDeliveryDispatcher.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertDeliverySealedManifestHashGuard.cs"));

        dispatcher.Should().Contain("AlertDeliverySealedManifestHashGuard");
        guard.Should().Contain("ComputeHash");
    }

    [Fact]
    public void Suggestion268_exec_digest_email_dispatch_reverify_sealed_hash()
    {
        string scanner = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestWeeklyDeliveryScanner.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Notifications",
                "Email",
                "ExecDigestEmailDispatchSealedManifestHashGuard.cs"));

        scanner.Should().Contain("ExecDigestEmailDispatchSealedManifestHashGuard");
        guard.Should().Contain("ExecDigestSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion269_ui_governance_trace_work_item_copy_fail_closed_on_sealed_hash()
    {
        string copyButton = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CopyFindingAsWorkItemButton.tsx"));

        copyButton.Should().Contain("CopyGovernanceQueueWorkItemButton");
        copyButton.Should().Contain("CopyTraceRowWorkItemButton");
        copyButton.Should().Contain("findingWorkItemSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion270_run_trust_evidence_card_fail_closed_on_sealed_hash()
    {
        string builder = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Trust", "RunTrustEvidenceCardBuilder.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Trust", "RunTrustEvidenceSealedManifestHashGuard.cs"));

        builder.Should().Contain("RunTrustEvidenceSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion271_advisory_scan_compare_to_baseline_fail_closed_on_sealed_hash()
    {
        string schedule = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryScanRunner.ScheduleCore.cs"));

        schedule.Should().Contain("AdvisoryScanCompareToSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion273_comparison_drift_analyze_fail_closed_on_sealed_hash()
    {
        string replay = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ComparisonReplayService.cs"));

        replay.Should().Contain("EnsureDriftAnalyzeSealedManifestHashesOrThrowAsync");
    }

    [Fact]
    public void Suggestion275_manifest_version_compare_fail_closed_on_sealed_hash()
    {
        string compare = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Compare.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "ManifestVersionCompareSealedManifestHashGuard.cs"));

        compare.Should().Contain("ManifestVersionCompareSealedManifestHashGuard");
        guard.Should().Contain("ManifestGoldenReadSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion276_advisory_improvements_plan_fail_closed_on_sealed_hash()
    {
        string improvements = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryWorkflowFacade.Improvements.cs"));

        improvements.Should().Contain("AdvisoryImprovementsPlanSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion280_create_work_item_dialog_fail_closed_on_sealed_hash()
    {
        string button = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "work-items", "CreateWorkItemButton.tsx"));

        button.Should().Contain("findingWorkItemSealedManifestCopyBlockedReason");
    }
}
