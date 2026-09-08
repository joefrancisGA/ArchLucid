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
}
