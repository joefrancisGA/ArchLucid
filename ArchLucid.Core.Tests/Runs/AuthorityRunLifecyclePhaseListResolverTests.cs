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
}
