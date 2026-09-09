using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BoundArchitectureInventoryGraphOverlayApplicatorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid SnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid CloudResourceId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task ApplyAsync_unboundArchitecture_returnsGraphUnchanged()
    {
        GraphSnapshot graph = CreateBaseGraph();
        RunRecord run = CreateRun(architectureId: null);

        BoundArchitectureInventoryGraphOverlayApplicator sut = CreateSut(
            binding: null,
            snapshot: null);

        GraphSnapshot result = await sut.ApplyAsync(Scope, run, graph, CancellationToken.None);

        result.Should().BeSameAs(graph);
    }

    [Fact]
    public async Task ApplyAsync_boundSnapshotReadable_addsObservedFactInventoryNodes()
    {
        GraphSnapshot graph = CreateBaseGraph();
        RunRecord run = CreateRun(architectureId: ArchitectureId);

        BoundArchitectureInventoryGraphOverlayApplicator sut = CreateSut(
            binding: new ArchitectureInventoryBindingRecord
            {
                ArchitectureId = ArchitectureId,
                SnapshotId = SnapshotId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                BoundBy = "actor@example.com",
                BoundUtc = DateTime.UtcNow,
            },
            snapshot: CreateSnapshotFixture());

        GraphSnapshot result = await sut.ApplyAsync(Scope, run, graph, CancellationToken.None);

        result.Nodes.Should().HaveCount(2);
        result.Nodes.Should().Contain(node =>
            node.Properties.GetValueOrDefault("cloudResourceId") == CloudResourceId.ToString("D")
            && node.Properties.GetValueOrDefault(StructuredDiagramGraphPropertyKeys.ProvenanceKind)
                == StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public async Task ApplyAsync_boundButSnapshotUnreadable_skipsMergeWithoutFakingNodes()
    {
        GraphSnapshot graph = CreateBaseGraph();
        RunRecord run = CreateRun(architectureId: ArchitectureId);

        BoundArchitectureInventoryGraphOverlayApplicator sut = CreateSut(
            binding: new ArchitectureInventoryBindingRecord
            {
                ArchitectureId = ArchitectureId,
                SnapshotId = SnapshotId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                BoundBy = "actor@example.com",
                BoundUtc = DateTime.UtcNow,
            },
            snapshot: null);

        GraphSnapshot result = await sut.ApplyAsync(Scope, run, graph, CancellationToken.None);

        result.Nodes.Should().HaveCount(1);
        result.Nodes[0].NodeId.Should().Be("context-node");
    }

    private static BoundArchitectureInventoryGraphOverlayApplicator CreateSut(
        ArchitectureInventoryBindingRecord? binding,
        AzureInventorySnapshotDetailReadModel? snapshot)
    {
        Mock<IArchitectureInventoryBindingRepository> bindingRepository = new();
        bindingRepository
            .Setup(repository => repository.TryGetByArchitectureIdAsync(
                Scope,
                ArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(binding);

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(
                Scope,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new BoundArchitectureInventoryGraphOverlayApplicator(
            bindingRepository.Object,
            snapshotRepository.Object,
            NullLogger<BoundArchitectureInventoryGraphOverlayApplicator>.Instance);
    }

    private static GraphSnapshot CreateBaseGraph()
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
        };
    }

    private static RunRecord CreateRun(Guid? architectureId)
    {
        return new RunRecord
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ArchitectureId = architectureId,
        };
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshotFixture()
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Scope.TenantId,
                CreatedUtc = DateTime.UtcNow,
                CapturedUtc = DateTime.UtcNow,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = Scope.TenantId,
                    CloudResourceId = CloudResourceId,
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod",
                    ResourceType = "Microsoft.Sql/servers",
                },
            ],
            Relationships = [],
        };
    }
}
