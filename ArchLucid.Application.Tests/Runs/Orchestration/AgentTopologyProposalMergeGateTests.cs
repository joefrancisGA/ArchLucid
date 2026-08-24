using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.Serialization;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;

namespace ArchLucid.Application.Tests.Runs.Orchestration;[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateTests
{
    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedProposalLabels()
    {
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "inv-1", label: "existing-api"));

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-1", "ds-1")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsServicesKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = Graph(ComputeNode());

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle()
            .Which.ServiceId.Should().Be("svc-1");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsDatastoresKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = Graph(DataNode());

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-1",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle()
            .Which.DatastoreId.Should().Be("ds-1");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByRenamedServiceLabels()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].SourceId.Should().Be("renamed-api");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByArmResourceIdProperty()
    {
        const string vmResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "t1", label: "vm-graph", sourceId: null, sourceType: null, properties: new Dictionary<string, string> { ["resourceId"] = vmResourceId }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(vmResourceId)));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedBySyntheticServiceNodeId()
    {
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "t1"), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-api")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedBySyntheticDatastoreNodeIdForStorageCategory()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "t1"),
            Node("blob-1", "artifacts", category: GraphTopologyCategories.Storage, sourceId: "azurerm_storage_account.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-artifacts")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByRenamedDatastoreLabels()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-1",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].TargetId.Should().Be("renamed-sql");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipOnlyProposalsReferencingAgentProposedGraphEndpoints()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("worker")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].SourceId.Should().Be("worker");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipOnlyProposalsBetweenAgentProposedGraphEndpoints()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode(nodeId: "ds-cache", label: "cache", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("worker", "cache")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedServiceOverlayForAgentProposedGraphNode()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode());

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedDatastoreOverlayForAgentProposedGraphNode()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api"),
            DataNode(nodeId: "ds-sql", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasFromPriorResult()
    {
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "svc-api"), DataNode(nodeId: "ds-sql"));

        AgentResult topology = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = ResultFor(AgentType.Cost, ProposalFor(AgentType.Cost, Relationship("renamed-api")), resultId: "cost-1");

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology, cost]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_RejectsRelationshipToUnknownEndpoint()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode(nodeId: "ds-cache", label: "cache", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("worker", "phantom")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_AllowsRelationshipBetweenAgentProposedEndpoints()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode(nodeId: "ds-cache", label: "cache", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("worker", "cache")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_AllowsNewServiceDeclarationsInSameBatch()
    {
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenMixedGraphExists_AllowsTopologyToDeclareNewServicesAlongsideAgentProposedNodes()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_RejectsRelationshipOnlyProposalsWithoutDeclaredEndpoints()
    {
        GraphSnapshot graph = Graph();

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("phantom", "other")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsGreenfieldServiceAndDatastoreProposals()
    {
        GraphSnapshot graph = Graph();

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
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_StripsRelationshipsReferencingUndeclaredEndpoints()
    {
        GraphSnapshot graph = Graph();

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
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "phantom",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasFromPriorResult()
    {
        GraphSnapshot graph = Graph();

        AgentResult topology = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = ResultFor(AgentType.Cost, ProposalFor(AgentType.Cost, Relationship("renamed-api")), resultId: "cost-1");

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology, cost]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasWhenCostResultAppearsFirst()
    {
        GraphSnapshot graph = Graph();

        AgentResult topology = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = ResultFor(AgentType.Cost, ProposalFor(AgentType.Cost, Relationship("renamed-api")), resultId: "cost-1");

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost, topology]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsTopologyRelationshipOnlyFollowUpReferencingPriorTopologyRenameAliasWhenFollowUpAppearsFirst()
    {
        GraphSnapshot graph = Graph();

        AgentResult firstTopology = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult followUpTopology = TopologyResult(RelationshipProposal(Relationship("renamed-api")), resultId: "topology-2");

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [followUpTopology, firstTopology]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r =>
            r.ResultId == "topology-2" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsRelationshipOnlyFollowUpWithUndeclaredRenameLabels()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult declaration = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult followUp = TopologyResult(RelationshipProposal(Relationship("renamed-api", "renamed-sql")), resultId: "topology-2");

        AgentResult[] results = [followUp, declaration];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, results);

        filtered.Should().ContainSingle(r => r.ResultId == "topology-1");
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_arm_source_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

        GraphSnapshot graph = Graph(
            ComputeNode(sourceId: null, sourceType: null, properties: new Dictionary<string, string> { ["resourceId"] = rawArmId }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(paddedArmId)));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_arm_relationship_after_json_round_trip_when_property_key_is_pascal_resourceId()
    {
        // In-memory bags use OrdinalIgnoreCase; JSON deserialize used a case-sensitive dictionary, so PascalCase
        // ResourceId survived write but was invisible to TryReadTopologyResourceId("resourceId") after restore.
        const string armId =
            "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Web/sites/app1";

        GraphSnapshot graph = Graph(
            ComputeNode(
                sourceId: null,
                sourceType: null,
                properties: new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["ResourceId"] = armId
                }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(armId)));

        AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]).Should().ContainSingle();

        byte[] utf8 = GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(graph);
        GraphSnapshot restored = GraphJsonSerialization.DeserializeSnapshot(utf8)!;

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(restored, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_arm_relationship_when_ordinal_properties_use_pascal_resourceId()
    {
        // SQL relational reload builds Ordinal bags and keeps the persisted PropertyKey casing (often ResourceId).
        // TryReadTopologyResourceId used exact TryGetValue("resourceId"), so ARM-keyed relationships were dropped.
        const string armId =
            "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Web/sites/app1";

        GraphSnapshot graph = Graph(
            ComputeNode(
                sourceId: null,
                sourceType: null,
                properties: new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["ResourceId"] = armId
                }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(armId)));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_graph_resource_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

        GraphSnapshot graph = Graph(
            ComputeNode(sourceId: null, sourceType: null, properties: new Dictionary<string, string> { ["resourceId"] = paddedArmId }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(rawArmId)));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_graph_terraform_source_id_has_surrounding_whitespace()
    {
        const string rawTerraformSourceId = "azurerm_app_service.main";
        const string paddedTerraformSourceId = $"  {rawTerraformSourceId}  ";

        GraphSnapshot graph = Graph(ComputeNode(sourceId: paddedTerraformSourceId), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(rawTerraformSourceId)));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_datastore_node_has_missing_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            Node("ds-1", "sql", sourceId: "azurerm_mssql_server.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sql")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_datastore_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ds-1", label: "sql", sourceId: "azurerm_mssql_server.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sql")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_sql_managed_instance_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mi-1", label: "sqlmi", sourceId: "azurerm_sql_managed_instance.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sqlmi")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_app_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-api")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedServiceOverlayWhenServiceIdHasSurroundingWhitespace()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
                        ServiceName = "renamed-api",
                        ServiceId = "  svc-api  ",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_api_management_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "apim-1", label: "apim", sourceId: "azurerm_api_management.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-apim")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_static_site_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "web-1", label: "frontend", sourceId: "azurerm_static_site.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-frontend")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_signalr_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "signalr-1", label: "realtime", sourceId: "azurerm_signalr_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-realtime")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_logic_app_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "logic-1", label: "workflow", sourceId: "azurerm_logic_app_workflow.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-workflow")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_key_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "kv-1", label: "secrets", sourceId: "azurerm_key_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-secrets")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_key_vault_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "kv-1", label: "secrets", sourceId: "azurerm_key_vault.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-secrets")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_plan_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "plan-1", label: "hosting", sourceId: "azurerm_service_plan.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-hosting")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_spring_cloud_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "spring-1", label: "backend", sourceId: "azurerm_spring_cloud_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-backend")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_search_service_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "search-1", label: "catalog", sourceId: "azurerm_search_service.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-catalog")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_search_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "search-1", label: "catalog", sourceId: "azurerm_search_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-catalog")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_servicebus_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sb-1", label: "orders", sourceId: "azurerm_servicebus_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-orders")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_eventhub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "eh-1", label: "events", sourceId: "azurerm_eventhub_namespace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-events")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_eventhub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "eh-1", label: "events", sourceId: "azurerm_eventhub_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-events")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_container_registry_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "acr-1", label: "acr", sourceId: "azurerm_container_registry.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-acr")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cognitive_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-openai")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_fabric_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sf-1", label: "fabric", sourceId: "azurerm_service_fabric_cluster.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-fabric")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_synapse_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "syn-1", label: "synapse", sourceId: "azurerm_synapse_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-synapse")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_synapse_workspace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "syn-1", label: "synapse", sourceId: "azurerm_synapse_workspace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-synapse")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_application_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "agw-1", label: "gateway", sourceId: "azurerm_application_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gateway")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_factory_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adf-1", label: "etl", sourceId: "azurerm_data_factory.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-etl")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_factory_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "adf-1", label: "etl", sourceId: "azurerm_data_factory.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-etl")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_linux_virtual_machine_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vm-1", label: "worker", sourceId: "azurerm_linux_virtual_machine.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-worker")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_mariadb_server_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mdb-1", label: "mariadb", sourceId: "azurerm_mariadb_server.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-mariadb")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_batch_account_node_has_storage_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            Node("batch-1", "batch", category: GraphTopologyCategories.Storage, sourceId: "azurerm_batch_account.main", sourceType: "Terraform"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-batch")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_machine_learning_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ml-1", label: "ml", sourceId: "azurerm_machine_learning_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ml")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_traffic_manager_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "tm-1", label: "traffic", sourceId: "azurerm_traffic_manager_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-traffic")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_databricks_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "dbx-1", label: "lakehouse", sourceId: "azurerm_databricks_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-lakehouse")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_load_balancer_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(DataNode(nodeId: "lb-1", label: "public", sourceId: "azurerm_lb.main"), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-public")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_kusto_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "kusto-1", label: "logs", sourceId: "azurerm_kusto_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-logs")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cdn_frontdoor_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fd-1", label: "edge", sourceId: "azurerm_cdn_frontdoor_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cdn_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        // Classic CDN profile (not Front Door) is still a service endpoint; miscategorized Data nodes must accept svc-.
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cdn-1", label: "edge", sourceId: "azurerm_cdn_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_app_configuration_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "appcfg-1", label: "config", sourceId: "azurerm_app_configuration.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-config")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_firewall_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fw-1", label: "perimeter", sourceId: "azurerm_firewall.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-perimeter")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_netapp_volume_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "netapp-1", label: "files", sourceId: "azurerm_netapp_volume.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-files")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_container_group_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cg-1", label: "worker", sourceId: "azurerm_container_group.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-worker")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_recovery_services_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "rsv-1", label: "backup", sourceId: "azurerm_recovery_services_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-backup")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_express_route_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "er-1", label: "wan", sourceId: "azurerm_express_route_circuit.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-wan")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_private_endpoint_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pe-1", label: "storage-pe", sourceId: "azurerm_private_endpoint.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-storage-pe")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_automation_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "aa-1", label: "runbooks", sourceId: "azurerm_automation_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-runbooks")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_log_analytics_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "law-1", label: "logs", sourceId: "azurerm_log_analytics_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-logs")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_log_analytics_workspace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "law-1", label: "logs", sourceId: "azurerm_log_analytics_workspace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_virtual_network_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vng-1", label: "vpn", sourceId: "azurerm_virtual_network_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-vpn")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_application_insights_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ai-1", label: "telemetry", sourceId: "azurerm_application_insights.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-telemetry")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_application_insights_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "ai-1", label: "telemetry", sourceId: "azurerm_application_insights.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-telemetry")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dns_zone_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dns-1", label: "corp", sourceId: "azurerm_dns_zone.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-corp")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_managed_disk_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "disk-1", label: "data-disk", sourceId: "azurerm_managed_disk.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-data-disk")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_bastion_host_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "bastion-1", label: "jump", sourceId: "azurerm_bastion_host.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-jump")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_stream_analytics_job_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "asa-1", label: "events", sourceId: "azurerm_stream_analytics_job.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-events")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_nat_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "nat-1", label: "egress", sourceId: "azurerm_nat_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-egress")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_iothub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "iot-1", label: "devices", sourceId: "azurerm_iothub.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-devices")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_entra_id_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "idp-1", label: "idp", sourceId: "azuread_application.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-idp")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_powerbi_embedded_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pbi-1", label: "bi", sourceId: "azurerm_powerbi_embedded.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-bi")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_api_connection_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "conn-1", label: "sharepoint", sourceId: "azurerm_api_connection.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sharepoint")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_eventgrid_topic_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "eg-1", label: "orders", sourceId: "azurerm_eventgrid_topic.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-orders")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_monitor_action_group_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "mag-1", label: "alerts", sourceId: "azurerm_monitor_action_group.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-alerts")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_redis_enterprise_cache_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "redis-1", label: "cache", sourceId: "azurerm_redis_enterprise_cache.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-cache")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_communication_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "acs-1", label: "sms", sourceId: "azurerm_communication_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sms")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_maps_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "maps-1", label: "geo", sourceId: "azurerm_maps_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-geo")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_web_pubsub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "wps-1", label: "realtime", sourceId: "azurerm_web_pubsub.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-realtime")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_share_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "share-1", label: "partner", sourceId: "azurerm_data_share.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-partner")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_healthbot_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "hb-1", label: "carebot", sourceId: "azurerm_healthbot_healthbot.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-carebot")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_digital_twins_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "dt-1", label: "factory", sourceId: "azurerm_digital_twins_instance.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-factory")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_notification_hub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "nh-1", label: "push", sourceId: "azurerm_notification_hub_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-push")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_media_services_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ams-1", label: "stream", sourceId: "azurerm_media_services_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-stream")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_fluid_relay_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fr-1", label: "collab", sourceId: "azurerm_fluid_relay_server.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-collab")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_elastic_san_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "esan-1", label: "vol", sourceId: "azurerm_elastic_san.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-vol")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_orbital_spacecraft_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "orb-1", label: "sat", sourceId: "azurerm_orbital_spacecraft.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sat")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_healthcare_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "hc-1", label: "fhir", sourceId: "azurerm_healthcare_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-fhir")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_virtual_hub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vh-1", label: "wan", sourceId: "azurerm_virtual_hub.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-wan")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_managed_lustre_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ml-1", label: "hpc", sourceId: "azurerm_managed_lustre_file_system.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-hpc")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_lab_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "lab-1", label: "devbox", sourceId: "azurerm_lab_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-devbox")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_video_indexer_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "vi-1", label: "media", sourceId: "azurerm_video_indexer.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-media")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_load_test_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "lt-1", label: "perf", sourceId: "azurerm_load_test.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-perf")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_hpc_cache_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "hpc-1", label: "scratch", sourceId: "azurerm_hpc_cache.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-scratch")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dynatrace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dt-1", label: "apm", sourceId: "azurerm_dynatrace_monitor.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-apm")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_backup_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "bv-1", label: "archive", sourceId: "azurerm_backup_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-archive")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_kubernetes_fleet_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "kf-1", label: "fleet", sourceId: "azurerm_kubernetes_fleet_manager.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-fleet")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_mobile_network_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mn-1", label: "ran", sourceId: "azurerm_mobile_network.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ran")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_relay_namespace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "relay-1", label: "bridge", sourceId: "azurerm_relay_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-bridge")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dev_center_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adc-1", label: "portal", sourceId: "azurerm_dev_center.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-portal")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_api_center_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "apc-1", label: "catalog", sourceId: "azurerm_api_center.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-catalog")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_graph_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ga-1", label: "identity", sourceId: "azurerm_graph_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-identity")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dashboard_grafana_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "graf-1", label: "metrics", sourceId: "azurerm_dashboard_grafana.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-metrics")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_fabric_capacity_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "fab-1", label: "analytics", sourceId: "azurerm_fabric_capacity.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-analytics")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_chaos_studio_target_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "chaos-1", label: "resilience", sourceId: "azurerm_chaos_studio_target.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-resilience")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_confidential_ledger_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "cl-1", label: "ledger", sourceId: "azurerm_confidential_ledger.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ledger")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_stack_hci_cluster_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "hci-1", label: "edge", sourceId: "azurerm_stack_hci_cluster.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_pinecone_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pc-1", label: "vectors", sourceId: "azurerm_pinecone.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-vectors")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_voice_services_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vs-1", label: "telephony", sourceId: "azurerm_voice_services_communications_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-telephony")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_mongo_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mc-1", label: "documents", sourceId: "azurerm_mongo_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-documents")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_workloads_sap_discovery_site_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sap-1", label: "discovery", sourceId: "azurerm_workloads_sap_discovery_site.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-discovery")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_elastic_cloud_elasticsearch_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "es-1", label: "search", sourceId: "azurerm_elastic_cloud_elasticsearch.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-search")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_palo_alto_local_rulestack_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "pa-1", label: "firewall", sourceId: "azurerm_palo_alto_local_rulestack.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-firewall")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_neptune_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "np-1", label: "graph", sourceId: "azurerm_neptune_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-graph")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_verifiedaccess_instance_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "va-1", label: "ztna", sourceId: "azurerm_verifiedaccess_instance.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-ztna")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_oracle_cloud_vmcluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ora-1", label: "oracle", sourceId: "azurerm_oracle_cloud_vmcluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-oracle")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_workloads_orchestrator_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "wo-1", label: "orchestrator", sourceId: "azurerm_workloads_orchestrator.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-orchestrator")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_oracle_autonomous_database_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "oad-1", label: "autonomous", sourceId: "azurerm_oracle_autonomous_database.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-autonomous")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_extended_location_custom_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "el-1", label: "edgezone", sourceId: "azurerm_extended_location_custom.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edgezone")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_storage_mover_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sm-1", label: "mover", sourceId: "azurerm_storage_mover.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-mover")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cognitive_deployment_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dep-1", label: "gpt4", sourceId: "azurerm_cognitive_deployment.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gpt4")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_active_directory_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "aad-1", label: "idp", sourceId: "azurerm_active_directory.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-idp")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_storage_blob_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "blob-1", label: "artifact", sourceId: "azurerm_storage_blob.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-artifact")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_kubernetes_configuration_flux_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "flux-1", label: "gitops", sourceId: "azurerm_kubernetes_configuration_flux.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gitops")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_storage_data_lake_gen2_path_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adls-1", label: "lakepath", sourceId: "azurerm_storage_data_lake_gen2_path.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-lakepath")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_site_recovery_fabric_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sr-1", label: "fabric", sourceId: "azurerm_site_recovery_fabric.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-fabric")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_collection_endpoint_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dce-1", label: "logs", sourceId: "azurerm_data_collection_endpoint.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_storage_share_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "share-1", label: "files", sourceId: "azurerm_storage_share.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-files")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_sql_server_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sql-1", label: "legacy-sql", sourceId: "azurerm_sql_server.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-legacy-sql")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_collection_rule_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dcr-1", label: "logs", sourceId: "azurerm_monitor_data_collection_rule.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cognitive_services_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_services_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-openai")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cognitive_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-openai")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsAgentProposedOnly_RejectsUninventoriedCostProposalLabels()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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
    public void FilterValidatedProposals_WhenGraphHasOnlyNonTopologyNodes_RejectsUninventoriedCostProposalLabels()
    {
        GraphSnapshot graph = Graph(
            new GraphNode { NodeId = "req-1", NodeType = GraphNodeTypes.Requirement, Label = "api" });

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
}
