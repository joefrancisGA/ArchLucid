using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramOrphanedStateApplierTests
{
    private const string MissingVirtualMachineArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-deleted";

    private const string RestorePointCollectionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/restorePointCollections/rpc-app";

    private const string StorageAccountArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/standalone";

    private const string WorkflowArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";

    private const string DeletedStorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st-deleted";

    private const string ConnectionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/connections/vpn-conn";

    private const string GatewayArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-a";

    private const string BastionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/bastionHosts/bastion-a";

    private const string SubnetArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/AzureBastionSubnet";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_peeled_bastion_subnet_uses_the_pre_peel_analysis_graph()
    {
        GraphNode bastion = CreateTopologyNode("bastion-node", BastionArmId, "Microsoft.Network/bastionHosts");
        GraphNode subnet = CreateTopologyNode("subnet-node", SubnetArmId, "Microsoft.Network/virtualNetworks/subnets");
        GraphSnapshot analysisGraph = CreateGraph(
            [bastion, subnet],
            [
                new GraphEdge
                {
                    EdgeId = "bastion-subnet",
                    FromNodeId = bastion.NodeId,
                    ToNodeId = subnet.NodeId,
                    EdgeType = "bastionToSubnet",
                },
            ]);

        DiagramAst ast = compiler.Compile(
            CreateGraph([bastion]),
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { OrphanAnalysisGraph = analysisGraph });

        DiagramNode result = ast.Nodes.Should().ContainSingle(node => node.ArmResourceId == BastionArmId).Subject;
        result.ConnectionState.Should().NotBe(InventoryDiagramConnectionState.Orphaned);
        result.ConnectionStateMessage.Should().NotContain("no longer exists");
    }

    [Fact]
    public void Compile_restore_point_collection_with_missing_vm_is_orphaned_and_names_vm()
    {
        GraphSnapshot graph = BuildRestorePointCollectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode restorePointCollection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == RestorePointCollectionArmId).Subject;
        restorePointCollection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Orphaned);
        restorePointCollection.ConnectionStateMessage.Should().Contain("vm-deleted");
        restorePointCollection.ConnectionStateMessage.Should().Contain("virtual machine");

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(restorePointCollection);
        caption.CombinedPlainText.Should().Contain("No stored association:");
        caption.CombinedPlainText.Should().Contain("vm-deleted");
    }

    [Fact]
    public void Compile_storage_account_without_optional_relationships_is_unconnected()
    {
        GraphSnapshot graph = BuildUnconnectedStorageGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode storage = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == StorageAccountArmId).Subject;
        storage.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(storage);
        caption.CombinedPlainText.Should().Contain("No diagram link was stored.");
    }

    [Fact]
    public void Compile_workflow_with_deleted_target_keeps_workflow_and_marks_action_unresolved()
    {
        GraphSnapshot graph = BuildWorkflowWithDeletedTargetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode workflow = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Logic/workflows").Subject;
        workflow.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        workflow.ConnectionStateMessage.Should().BeNull();
        workflow.UnresolvedRelationshipDetails.Should().ContainSingle(detail =>
            detail.Contains("SendEmail", StringComparison.Ordinal)
            && detail.Contains("st-deleted", StringComparison.Ordinal));

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(workflow);
        caption.CombinedPlainText.Should().Contain("SendEmail");
        caption.CombinedPlainText.Should().Contain("st-deleted");
        caption.CombinedPlainText.Should().NotContain("Orphaned:");
    }

    [Fact]
    public void Compile_configured_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphSnapshot graph = BuildConfiguredConnectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode connection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/connections").Subject;
        connection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        connection.ConnectionStateMessage.Should().BeNull();
    }

    [Fact]
    public void Compile_observed_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphSnapshot graph = BuildObservedConnectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode connection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/connections").Subject;
        connection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        connection.ConnectionStateMessage.Should().BeNull();
    }

    [Fact]
    public void Compile_data_factory_without_a_cited_edge_stands_alone()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev-readonly";
        GraphSnapshot graph = CreateGraph(
        [
            CreateTopologyNode("factory-node", factoryArmId, "Microsoft.DataFactory/factories"),
        ]);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode factory = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.DataFactory/factories").Subject;
        factory.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        factory.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.DataFactoryNoStoredLinkDetail);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(factory);
        caption.CombinedPlainText.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.DataFactoryNoStoredLinkDetail);
        caption.CombinedPlainText.Should().NotContain("Connection state was not classified.");
    }

    [Fact]
    public void Compile_data_factory_with_a_cited_edge_stays_connected()
    {
        const string factoryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-linked";
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/linkedstore";
        GraphNode factory = CreateTopologyNode("factory-node", factoryArmId, "Microsoft.DataFactory/factories");
        GraphNode storage = CreateTopologyNode("storage-node", storageArmId, "Microsoft.Storage/storageAccounts");
        GraphEdge link = new()
        {
            EdgeId = "edge-factory-storage",
            FromNodeId = factory.NodeId,
            ToNodeId = storage.NodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryAdfLinkedService,
        };

        DiagramAst ast = compiler.Compile(CreateGraph([factory, storage], [link]), DiagramMode.FullSubscription);

        DiagramNode compiledFactory = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == factoryArmId).Subject;
        compiledFactory.ConnectionState.Should().Be(InventoryDiagramConnectionState.Connected);
        compiledFactory.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.DataFactoryNoStoredLinkDetail);
    }

    [Fact]
    public void Compile_logic_app_connection_without_a_citation_stands_alone()
    {
        const string connectionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/azureblob-1";
        GraphSnapshot graph = CreateGraph(
        [
            CreateTopologyNode("connection-node", connectionArmId, "Microsoft.Web/connections"),
        ]);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode connection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Web/connections").Subject;
        connection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        connection.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.LogicAppConnectionNotCitedDetail);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(connection);
        caption.CombinedPlainText.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.LogicAppConnectionNotCitedDetail);
        caption.CombinedPlainText.Should().NotContain("Connection state was not classified.");
    }

    [Fact]
    public void Compile_logic_app_connection_cited_by_a_workflow_stays_connected()
    {
        const string workflowArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";
        const string connectionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/azureblob-1";
        GraphNode workflow = CreateTopologyNode("workflow-node", workflowArmId, "Microsoft.Logic/workflows");
        GraphNode connection = CreateTopologyNode("connection-node", connectionArmId, "Microsoft.Web/connections");
        GraphEdge citation = new()
        {
            EdgeId = "edge-workflow-connection",
            FromNodeId = workflow.NodeId,
            ToNodeId = connection.NodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryLogicAppConnection,
        };

        DiagramAst ast = compiler.Compile(
            CreateGraph([workflow, connection], [citation]),
            DiagramMode.FullSubscription);

        DiagramNode compiledConnection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == connectionArmId).Subject;
        compiledConnection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Connected);
        compiledConnection.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.LogicAppConnectionNotCitedDetail);
    }

    [Fact]
    public void Compile_web_connection_with_empty_endpoints_is_not_orphaned()
    {
        const string connectionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/azureautomation";
        GraphNode connection = CreateTopologyNode("connection-node", connectionArmId, "Microsoft.Web/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Current.ToString();

        DiagramAst ast = compiler.Compile(CreateGraph([connection]), DiagramMode.FullSubscription);

        DiagramNode compiled = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == connectionArmId).Subject;
        compiled.ConnectionState.Should().NotBe(InventoryDiagramConnectionState.Orphaned);
    }

    [Fact]
    public void Compile_current_network_connection_with_missing_endpoint_stays_orphaned()
    {
        GraphNode gateway = CreateTopologyNode("gateway-node", GatewayArmId, "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode("connection-node", ConnectionArmId, "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Current.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        DiagramAst ast = compiler.Compile(
            CreateGraph([gateway, connection]),
            DiagramMode.FullSubscription);

        DiagramNode compiled = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/connections").Subject;
        compiled.ConnectionState.Should().Be(InventoryDiagramConnectionState.Orphaned);
    }

    [Fact]
    public void Compile_application_insights_without_an_edge_says_posture_is_not_modeled()
    {
        const string componentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/components/ai-aep-hi-dev-wus-001";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("component-node", componentArmId, "Microsoft.Insights/components"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode component = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Insights/components").Subject;
        component.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        component.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PostureNotModeledDetail);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(component);
        caption.CombinedPlainText.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PostureNotModeledDetail);
        caption.CombinedPlainText.Should().NotContain("Stands alone");
        caption.CombinedPlainText.Should().NotContain("Connection state was not classified.");
    }

    [Fact]
    public void Compile_api_management_without_an_edge_says_posture_is_not_modeled()
    {
        const string serviceArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ApiManagement/service/apim-hap-hawaii-nonprod";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("apim-node", serviceArmId, "Microsoft.ApiManagement/service"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode service = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.ApiManagement/service").Subject;
        service.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        service.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PostureNotModeledDetail);
    }

    [Fact]
    public void Compile_private_link_scope_without_a_cited_edge_stands_alone()
    {
        const string scopeArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/privateLinkScopes/extension-pls";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("scope-node", scopeArmId, "Microsoft.Insights/privateLinkScopes"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode scope = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Insights/privateLinkScopes").Subject;
        scope.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        scope.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PrivateLinkScopeNoScopedResourceDetail);
    }

    [Fact]
    public void Compile_private_link_scope_with_a_scoped_resource_edge_stays_connected()
    {
        const string scopeArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/privateLinkScopes/extension-pls";
        const string componentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/components/appinsights-1";
        GraphNode scope = CreateTopologyNode("scope-node", scopeArmId, "Microsoft.Insights/privateLinkScopes");
        GraphNode component = CreateTopologyNode("component-node", componentArmId, "Microsoft.Insights/components");
        GraphEdge scopedResource = new()
        {
            EdgeId = "edge-scope-component",
            FromNodeId = scope.NodeId,
            ToNodeId = component.NodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryAmplsScopedResource,
        };

        DiagramAst ast = compiler.Compile(CreateGraph([scope, component], [scopedResource]), DiagramMode.FullSubscription);

        DiagramNode compiledScope = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == scopeArmId).Subject;
        compiledScope.ConnectionState.Should().Be(InventoryDiagramConnectionState.Connected);
        compiledScope.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.PrivateLinkScopeNoScopedResourceDetail);
    }

    [Fact]
    public void Compile_nat_gateway_without_a_subnet_edge_stands_alone()
    {
        const string natGatewayArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/natGateways/ng-edw-hi-dev";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("nat-node", natGatewayArmId, "Microsoft.Network/natGateways"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode natGateway = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/natGateways").Subject;
        natGateway.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        natGateway.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.NatGatewayNoStoredSubnetDetail);
    }

    [Fact]
    public void Compile_nat_gateway_with_a_subnet_edge_stays_connected()
    {
        const string natGatewayArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/natGateways/ng-edw-hi-dev";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/default";
        GraphNode natGateway = CreateTopologyNode("nat-node", natGatewayArmId, "Microsoft.Network/natGateways");
        GraphNode subnet = CreateTopologyNode("subnet-node", subnetArmId, "Microsoft.Network/virtualNetworks/subnets");
        GraphEdge natToSubnet = new()
        {
            EdgeId = "edge-nat-subnet",
            FromNodeId = natGateway.NodeId,
            ToNodeId = subnet.NodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.NatGatewayToSubnet,
            Label = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryNatGatewaySubnet,
        };

        DiagramAst ast = compiler.Compile(CreateGraph([natGateway, subnet], [natToSubnet]), DiagramMode.FullSubscription);

        DiagramNode compiledNat = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == natGatewayArmId).Subject;
        compiledNat.ConnectionState.Should().Be(InventoryDiagramConnectionState.Connected);
        compiledNat.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.NatGatewayNoStoredSubnetDetail);
    }

    [Fact]
    public void Compile_grafana_without_an_edge_says_posture_is_not_modeled()
    {
        const string grafanaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Dashboard/grafana/grafana-hi-nprd";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("grafana-node", grafanaArmId, "Microsoft.Dashboard/grafana"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode grafana = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Dashboard/grafana").Subject;
        grafana.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        grafana.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PostureNotModeledDetail);
    }

    [Fact]
    public void Compile_compute_gallery_without_an_edge_says_posture_is_not_modeled()
    {
        const string galleryArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/galleries/gal_img_vdi";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("gallery-node", galleryArmId, "Microsoft.Compute/galleries"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode gallery = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Compute/galleries").Subject;
        gallery.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        gallery.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.PostureNotModeledDetail);
    }

    [Fact]
    public void Compile_databricks_access_connector_without_a_citation_stands_alone()
    {
        const string connectorArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/unity-catalog-access-connector";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("connector-node", connectorArmId, "Microsoft.Databricks/accessConnectors"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode connector = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Databricks/accessConnectors").Subject;
        connector.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        connector.UnresolvedRelationshipDetails.Should().Contain(
            InventoryDiagramConnectionPostureCatalog.AccessConnectorNoWorkspaceCitationDetail);
    }

    [Fact]
    public void Compile_databricks_access_connector_with_a_workspace_edge_stays_connected()
    {
        const string workspaceArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/workspaces/dbws-edw";
        const string connectorArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/unity-catalog-access-connector";
        GraphNode workspace = CreateTopologyNode("workspace-node", workspaceArmId, "Microsoft.Databricks/workspaces");
        GraphNode connector = CreateTopologyNode("connector-node", connectorArmId, "Microsoft.Databricks/accessConnectors");
        GraphEdge citation = new()
        {
            EdgeId = "edge-workspace-connector",
            FromNodeId = workspace.NodeId,
            ToNodeId = connector.NodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryDatabricksAccessConnector,
        };

        DiagramAst ast = compiler.Compile(CreateGraph([workspace, connector], [citation]), DiagramMode.FullSubscription);

        DiagramNode compiledConnector = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == connectorArmId).Subject;
        compiledConnector.ConnectionState.Should().Be(InventoryDiagramConnectionState.Connected);
        compiledConnector.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.AccessConnectorNoWorkspaceCitationDetail);
    }

    [Fact]
    public void Compile_databricks_access_connector_with_missing_parent_stays_orphaned()
    {
        const string connectorArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/unity-catalog-access-connector";
        const string missingWorkspaceArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/workspaces/dbws-deleted";
        GraphNode connector = CreateTopologyNode("connector-node", connectorArmId, "Microsoft.Databricks/accessConnectors");
        connector.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Current.ToString();
        connector.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] =
            missingWorkspaceArmId;

        DiagramAst ast = compiler.Compile(CreateGraph([connector]), DiagramMode.FullSubscription);

        DiagramNode compiled = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == connectorArmId).Subject;
        compiled.ConnectionState.Should().Be(InventoryDiagramConnectionState.Orphaned);
        compiled.UnresolvedRelationshipDetails.Should().NotContain(
            InventoryDiagramConnectionPostureCatalog.AccessConnectorNoWorkspaceCitationDetail);
    }

    [Fact]
    public void Compile_event_hub_namespace_without_an_edge_stays_unclassified()
    {
        const string namespaceArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh-unlisted";
        DiagramAst ast = compiler.Compile(
            CreateGraph(
            [
                CreateTopologyNode("eh-node", namespaceArmId, "Microsoft.EventHub/namespaces"),
            ]),
            DiagramMode.FullSubscription);

        DiagramNode eventHub = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.EventHub/namespaces").Subject;
        eventHub.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unknown);
        eventHub.UnresolvedRelationshipDetails.Should().BeEmpty();

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(eventHub);
        caption.CombinedPlainText.Should().Contain("Connection state was not stored.");
    }

    [Fact]
    public void Compile_storage_account_without_optional_relationships_keeps_the_storage_sentence()
    {
        DiagramAst ast = compiler.Compile(BuildUnconnectedStorageGraph(), DiagramMode.FullSubscription);

        DiagramNode storage = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == StorageAccountArmId).Subject;
        storage.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        storage.UnresolvedRelationshipDetails.Should().Contain("No stored storage link yet.");
    }

    private static GraphSnapshot BuildRestorePointCollectionGraph()
    {
        GraphNode restorePointCollection = CreateTopologyNode(
            "rpc-node",
            RestorePointCollectionArmId,
            "Microsoft.Compute/restorePointCollections");
        restorePointCollection.Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] =
            MissingVirtualMachineArmId;

        return CreateGraph([restorePointCollection]);
    }

    [Fact]
    public void Apply_hidden_subnet_placement_uses_reviewer_facing_sentence_P12()
    {
        GraphNode eventHub = CreateTopologyNode(
            "eh-node",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh-ns",
            "Microsoft.EventHub/namespaces");
        GraphSnapshot graph = CreateGraph(
            [eventHub],
            [
                new GraphEdge
                {
                    EdgeId = "hidden-subnet",
                    FromNodeId = eventHub.NodeId,
                    ToNodeId = "vnet-node",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement,
                },
            ]);
        DiagramNode diagramNode = CreateDiagramNode(eventHub.NodeId, eventHub.Properties["arm.id"]);

        ApplyOrphanPosture(diagramNode, graph);

        diagramNode.ConnectionState.Should().Be(InventoryDiagramConnectionState.Used);
        diagramNode.ConnectionStateMessage.Should().Be(
            "Placed on a subnet that is hidden on this diagram.");
    }

    [Fact]
    public void Apply_effective_network_control_uses_stored_control_sentence_P13()
    {
        GraphNode subnet = CreateTopologyNode(
            "subnet-node",
            SubnetArmId,
            "Microsoft.Network/virtualNetworks/subnets");
        GraphSnapshot graph = CreateGraph(
            [subnet],
            [
                new GraphEdge
                {
                    EdgeId = "effective-nsg",
                    FromNodeId = subnet.NodeId,
                    ToNodeId = "nsg-node",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryEffectiveNsg,
                },
            ]);
        DiagramNode diagramNode = CreateDiagramNode(subnet.NodeId, subnet.Properties["arm.id"]);

        ApplyOrphanPosture(diagramNode, graph);

        diagramNode.ConnectionState.Should().Be(InventoryDiagramConnectionState.Used);
        diagramNode.ConnectionStateMessage.Should().Be(
            "An effective route or network security group is stored. Observed use was not stored.");
    }

    [Fact]
    public void Apply_public_ip_with_parent_in_snapshot_uses_attachment_sentence_P20()
    {
        const string publicIpArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-nic";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-a";
        GraphNode publicIp = CreateTopologyNode("pip-node", publicIpArmId, "Microsoft.Network/publicIPAddresses");
        publicIp.Properties["ipConfiguration.id"] = nicArmId + "/ipConfigurations/ipconfig1";
        GraphNode nic = CreateTopologyNode("nic-node", nicArmId, "Microsoft.Network/networkInterfaces");
        GraphSnapshot graph = CreateGraph([publicIp, nic], []);
        DiagramNode diagramNode = CreateDiagramNode(publicIp.NodeId, publicIpArmId);

        ApplyOrphanPosture(diagramNode, graph);

        diagramNode.ConnectionState.Should().Be(InventoryDiagramConnectionState.Used);
        diagramNode.ConnectionStateMessage.Should().Be(
            "Attached to nic-a. That resource is in this inventory snapshot.");
    }

    private static GraphSnapshot BuildUnconnectedStorageGraph()
    {
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");

        return CreateGraph([storage]);
    }

    private static GraphSnapshot BuildWorkflowWithDeletedTargetGraph()
    {
        GraphNode workflow = CreateTopologyNode(
            "workflow-node",
            WorkflowArmId,
            "Microsoft.Logic/workflows");
        workflow.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix}SendEmail{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix}"] =
            DeletedStorageArmId;

        return CreateGraph([workflow]);
    }

    private static GraphSnapshot BuildConfiguredConnectionGraph()
    {
        GraphNode gateway = CreateTopologyNode(
            "gateway-node",
            GatewayArmId,
            "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            ConnectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Configured.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        return CreateGraph([gateway, connection]);
    }

    private static GraphSnapshot BuildObservedConnectionGraph()
    {
        GraphNode gateway = CreateTopologyNode(
            "gateway-node",
            GatewayArmId,
            "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            ConnectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Observed.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        return CreateGraph([gateway, connection]);
    }

    private static void ApplyOrphanPosture(DiagramNode diagramNode, GraphSnapshot graph)
    {
        DiagramAst ast = new()
        {
            Title = "test",
            Nodes = [diagramNode],
        };
        Dictionary<string, string> graphToDiagram = new(StringComparer.Ordinal)
        {
            [diagramNode.SeedNodeId!] = diagramNode.NodeId,
        };
        InventoryDiagramOrphanedStateApplier.Apply(ast, graph, graphToDiagram);
    }

    private static DiagramNode CreateDiagramNode(string seedNodeId, string armResourceId)
    {
        return new DiagramNode
        {
            NodeId = $"diagram-{seedNodeId}",
            SeedNodeId = seedNodeId,
            Label = armResourceId,
            NodeType = GraphNodeTypes.TopologyResource,
            ArmResourceId = armResourceId,
        };
    }

    private static GraphSnapshot CreateGraph(IReadOnlyList<GraphNode> nodes) =>
        CreateGraph(nodes, []);

    private static GraphSnapshot CreateGraph(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = MermaidIdSanitizer.Sanitize(armId),
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
