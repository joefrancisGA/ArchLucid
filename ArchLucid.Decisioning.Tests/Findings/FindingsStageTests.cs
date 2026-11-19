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
public sealed class FindingsPolicyStampStageTests
{
    [Fact]
    public async Task ExecuteAsync_without_scope_provider_is_noop()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
        };

        FindingsPolicyStampStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        graph.Nodes.Should().BeEmpty();
    }
}
