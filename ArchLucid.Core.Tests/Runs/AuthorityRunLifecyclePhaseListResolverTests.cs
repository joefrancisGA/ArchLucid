using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunLifecyclePhaseListResolverTests
{
    [Fact]
    public void ResolveFromRunHeader_committed_without_golden_manifest_returns_not_started_for_in_memory_rows()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = null,
            ContextSnapshotId = null,
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        // SQL dbo.Runs CHECK prevents Committed without GoldenManifestId on persisted rows; this guards in-memory/test fixtures only.
        phase.Should().Be(AuthorityRunLifecyclePhase.NotStarted);
    }

    [Fact]
    public void ResolveFromRunHeader_failed_with_context_snapshot_returns_failed_not_in_progress()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            ContextSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            LastFailureReason = """{"schemaVersion":1,"failureClass":"timeout"}""",
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        phase.Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_failed_without_progress_markers_returns_failed_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            LastFailureReason = "async create worker failed before coordination",
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        phase.Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_quality_rejected_with_context_snapshot_returns_failed_not_in_progress()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
            ContextSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            LastFailureReason = """{"schemaVersion":1,"failureClass":"qualityGate"}""",
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        phase.Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_dead_lettered_with_forward_compatible_schema_version_returns_failed()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            ContextSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            LastFailureReason = """{"schemaVersion":2,"failureClass":"PipelineDeadLetter"}""",
        };

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header);

        phase.Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_committed_with_golden_manifest_returns_complete()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Complete);
    }

    [Fact]
    public void ResolveFromRunHeader_failed_partial_with_context_snapshot_returns_failed_not_in_progress()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.FailedPartial),
            ContextSnapshotId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_numeric_ordinal_failed_partial_legacy_status_returns_failed()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            LegacyRunStatus = ((int)ArchitectureRunStatus.FailedPartial).ToString(),
            ContextSnapshotId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_waiting_for_results_without_progress_markers_returns_in_progress_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_partially_completed_without_progress_markers_returns_failed_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.PartiallyCompleted),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_golden_manifest_without_committed_status_returns_in_progress_not_complete()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            GoldenManifestId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_whitespace_only_legacy_status_returns_not_started_for_in_memory_rows_only()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03"),
            LegacyRunStatus = "   ",
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        // SQL CK_Runs_LegacyRunStatus allowlist rejects whitespace-only LegacyRunStatus on persisted rows.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.NotStarted);
    }

    [Fact]
    public void ResolveFromRunHeader_retrying_with_stale_context_snapshot_returns_in_progress()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Retrying),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            GoldenManifestId = null,
        };

        // FailedRunRetryAdmission retains ContextSnapshotId; list/export aligns with RunOperationProjector Running.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_dead_lettered_committed_run_returns_failed_not_complete()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            GoldenManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            LastFailureReason = """{"schemaVersion":1,"failureClass":"PipelineDeadLetter"}""",
        };

        // Dead-letter detection runs before committed+manifest Complete branch so operators still see Failed on list surfaces.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_tasks_generated_without_progress_markers_returns_in_progress_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_ready_for_commit_without_progress_markers_returns_in_progress_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_quality_rejected_without_progress_markers_returns_failed_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
            ContextSnapshotId = null,
            GoldenManifestId = null,
            LastFailureReason = """{"schemaVersion":1,"failureClass":"qualityGate"}""",
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_numeric_ordinal_committed_with_golden_manifest_returns_in_progress_not_complete_for_in_memory_rows()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09"),
            LegacyRunStatus = ((int)ArchitectureRunStatus.Committed).ToString(),
            GoldenManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        };

        // IsCommittedWithGoldenManifest matches enum name only; SQL CK_Runs_LegacyRunStatus allowlist blocks numeric ordinals on persisted rows.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_created_with_context_snapshot_returns_in_progress_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            GoldenManifestId = null,
        };

        // Progress-marker branch follows legacy-status checks; Created is not an in-progress legacy status.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_failed_partial_without_progress_markers_returns_failed_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.FailedPartial),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    [Fact]
    public void ResolveFromRunHeader_retrying_without_progress_markers_returns_in_progress_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Retrying),
            ContextSnapshotId = null,
            GoldenManifestId = null,
        };

        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Fact]
    public void ResolveFromRunHeader_pipeline_dead_letter_on_created_status_returns_failed_not_not_started()
    {
        RunRecord header = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13"),
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            ContextSnapshotId = null,
            GoldenManifestId = null,
            LastFailureReason = """{"schemaVersion":1,"failureClass":"PipelineDeadLetter"}""",
        };

        // Dead-letter detection precedes legacy-status and progress-marker branches.
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(header)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }
}
