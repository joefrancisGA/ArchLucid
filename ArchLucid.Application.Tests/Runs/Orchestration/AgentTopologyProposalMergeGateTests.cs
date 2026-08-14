using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateTests
{
    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void WithMergedTopologyProposals_WhenInventoryExists_AllowsMatchingInventoriedLabelsOnly()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "existing-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].Label.Should().Be("existing-api");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedCostProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult cost = new()
        {
            AgentType = AgentType.Cost,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedComplianceProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRequiredControlsOnlyComplianceProposal()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                RequiredControls = ["encrypt-at-rest"]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.RequiredControls.Should().ContainSingle("encrypt-at-rest");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsRelationshipsWithOnlyOneInventoriedEndpoint()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "existing-api",
                        TargetId = "invented-db"
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-1",
                        TargetId = "ds-1",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
