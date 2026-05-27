using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineStageCheckpointTests
{
    [Fact]
    public void IsComplete_context_ingestion_when_context_snapshot_fk_set()
    {
        RunRecord run = new() { RunId = Guid.NewGuid(), ContextSnapshotId = Guid.NewGuid() };

        ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStageCheckpoint
            .IsComplete(run, "context_ingestion")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsComplete_graph_when_graph_snapshot_fk_set()
    {
        RunRecord run = new() { RunId = Guid.NewGuid(), GraphSnapshotId = Guid.NewGuid() };

        ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStageCheckpoint
            .IsComplete(run, "graph")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsComplete_decisioning_requires_both_trace_and_manifest_fks()
    {
        RunRecord run = new() { RunId = Guid.NewGuid(), DecisionTraceId = Guid.NewGuid() };

        ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStageCheckpoint
            .IsComplete(run, "decisioning")
            .Should()
            .BeFalse();

        run.GoldenManifestId = Guid.NewGuid();

        ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStageCheckpoint
            .IsComplete(run, "decisioning")
            .Should()
            .BeTrue();
    }
}
