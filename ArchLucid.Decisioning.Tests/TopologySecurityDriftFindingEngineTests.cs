using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologySecurityDriftFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_without_prior_graph_records_held_check_and_returns_empty()
    {
        HeldCheckLedger ledger = new();
        FindingAnalysisContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            HeldCheckLedger = ledger,
        };

        TopologySecurityDriftFindingEngine engine = CreateEngine(null);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
        ledger.BuildRollup().Should().Contain(entry => entry.InputCode == HeldCheckInputCode.PriorRunSnapshot);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_replica_removed_delta()
    {
        GraphSnapshot prior = BuildSqlGraph(includeReplica: true);
        GraphSnapshot current = BuildSqlGraph(includeReplica: false);
        Guid priorGraphId = Guid.NewGuid();

        TopologySecurityDriftFindingEngine engine = CreateEngine(prior);
        FindingAnalysisContext context = BuildContext(priorGraphId);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(current, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("topology-security-drift");
        finding.Payload.Should().BeOfType<TopologySecurityDriftFindingPayload>()
            .Which.Kind.Should().Be(TopologySecurityDriftFindingPayloadKind.ReplicaOrFailoverRemoved);
    }

    private static FindingAnalysisContext BuildContext(Guid priorGraphId) =>
        new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            Prior = new PriorReviewSnapshots
            {
                PriorRunId = Guid.NewGuid(),
                PriorGraphSnapshotId = priorGraphId,
            },
        };

    private static TopologySecurityDriftFindingEngine CreateEngine(GraphSnapshot? priorGraph)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        Mock<IGraphSnapshotRepository> graphSnapshots = new();
        graphSnapshots
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(priorGraph);

        return new TopologySecurityDriftFindingEngine(graphSnapshots.Object, scopeProvider.Object);
    }

    private static GraphSnapshot BuildSqlGraph(bool includeReplica)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeReplica)
        {
            properties["geo_redundant"] = "enabled";
        }

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "prior-context",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "prior-context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
                new GraphNode
                {
                    NodeId = "sql-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "prod-sql",
                    Properties = properties,
                },
            ],
        };
    }
}
