using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotEmitStageTests
{
    [Fact]
    public async Task ExecuteAsync_sets_generation_status_complete_when_no_failures()
    {
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.Snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = context.RunId,
            ContextSnapshotId = context.ContextSnapshotId,
            GraphSnapshotId = context.GraphSnapshot.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings = [],
            EngineFailures = [],
            SchemaVersion = 1,
        };

        FindingsSnapshotEmitStage stage = new(NullLogger<FindingsSnapshotEmitStage>.Instance);
        FindingsSnapshot result = await stage.ExecuteAsync(context, CancellationToken.None);

        result.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
    }
}
