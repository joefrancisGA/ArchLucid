using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagrams;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestLayoutSvgRendererTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_data_flow_rolls_up_repeated_storage_cards_and_keeps_members_for_export()
    {
        DiagramAst ast = BuildStorageRollupAst(5);

        DiagramForestLayoutResult onScreen = renderer.Render(ast);

        onScreen.Succeeded.Should().BeTrue(onScreen.Error);
        onScreen.Svg.Should().Contain("5 storage accounts");
        onScreen.Svg.Should().Contain("0 used · 5 no consumer found");
        onScreen.Svg.Should().Contain("Click to list the 5");
        onScreen.Svg.Should().NotContain("> [1] <");
        onScreen.Svg.Should().Contain("cursor=\"pointer\"");
        onScreen.Svg.Should().Contain("data-member-ids");
        XDocument onScreenDocument = XDocument.Parse(onScreen.Svg!);
        onScreenDocument
            .Descendants()
            .Where(element => element.Name.LocalName == "text")
            .Select(element => element.Value)
            .Should()
            .NotContain("storage-0 · No consumer found");

        DiagramForestLayoutResult export = renderer.Render(
            ast,
            new DiagramForestLayoutOptions
            {
                IncludeDataFlowRollupMembersInLegend = true,
            });

        export.Succeeded.Should().BeTrue(export.Error);
        export.Svg.Should().Contain(">5 storage accounts<");
        export.Svg.Should().NotContain("[1] 5 storage accounts");
        export.Svg.Should().Contain("storage-0 ·");
        export.Svg.Should().Contain("storage-4 ·");
    }

    [Fact]
    public void Render_data_flow_keeps_three_cards_and_different_neighbors_outside_rollup()
    {
        DiagramAst ast = BuildStorageRollupAst(5);
        ast.Nodes.AddRange(
        [
            new DiagramNode
            {
                NodeId = "consumer-a",
                Label = "consumer-a",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Web/sites",
                SubgraphId = "storage",
                OrderKey = 20,
            },
            new DiagramNode
            {
                NodeId = "consumer-b",
                Label = "consumer-b",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Web/sites",
                SubgraphId = "storage",
                OrderKey = 21,
            },
        ]);
        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = "storage-3",
            ToNodeId = "consumer-a",
            Label = "uses",
        });
        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = "storage-4",
            ToNodeId = "consumer-b",
            Label = "uses",
        });

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().NotContain("5 storage accounts");
        result.Svg.Should().Contain("storage-0");
        result.Svg.Should().Contain("storage-1");
        result.Svg.Should().Contain("storage-2");
        result.Svg.Should().Contain("storage-3");
        result.Svg.Should().Contain("storage-4");
    }

    private static DiagramAst BuildStorageRollupAst(int storageCount)
    {
        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "storage",
                    Label = "Storage",
                    OrderKey = 0,
                },
            ],
            Nodes = Enumerable.Range(0, storageCount)
                .Select(index => new DiagramNode
                {
                    NodeId = $"storage-{index}",
                    Label = $"storage-{index}",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "storage",
                    OrderKey = index,
                })
                .ToList(),
        };
    }

    [Fact]
    public void Render_data_flow_shows_human_type_captions_without_changing_other_modes()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "logic-connection",
                    Label = "office365",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/connections",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "access-connector",
                    Label = "unity-catalog-access-connector",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Databricks/accessConnectors",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "fabric",
                    Label = "hihapfabriccapchynprd",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Fabric/capacities",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "function",
                    Label = "function-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/sites",
                    ArmResourceKind = "functionapp",
                    OrderKey = 3,
                },
                new DiagramNode
                {
                    NodeId = "mysql-link",
                    Label = "azuremysql1",
                    NodeType = "TopologyResource",
                    ExternalLinkedServiceType = "AzureMySql",
                    OrderKey = 4,
                },
            ],
        };

        DiagramForestLayoutResult dataFlowResult = renderer.Render(ast);

        dataFlowResult.Succeeded.Should().BeTrue(dataFlowResult.Error);
        dataFlowResult.Svg.Should().Contain("Logic App connection");
        dataFlowResult.Svg.Should().Contain("Access connector");
        dataFlowResult.Svg.Should().Contain("Fabric capacity");
        dataFlowResult.Svg.Should().Contain("Function App");
        dataFlowResult.Svg.Should().Contain("MySQL link");
        dataFlowResult.Svg.Should().NotContain("Topology resource");
        XDocument.Parse(dataFlowResult.Svg!)
            .Descendants()
            .Where(element => element.Name.LocalName == "text")
            .Select(element => element.Value)
            .Should()
            .NotContain("App Service");

        ast.Title = "Azure inventory (FullSubscription)";
        DiagramForestLayoutResult fullSubscriptionResult = renderer.Render(ast);

        fullSubscriptionResult.Succeeded.Should().BeTrue(fullSubscriptionResult.Error);
        List<string> fullSubscriptionText = XDocument.Parse(fullSubscriptionResult.Svg!)
            .Descendants()
            .Where(element => element.Name.LocalName == "text")
            .Select(element => element.Value)
            .ToList();
        fullSubscriptionText.Should().NotContain("Logic App connection");
        fullSubscriptionText.Should().NotContain("Access connector");
        fullSubscriptionText.Should().NotContain("MySQL link");
    }

    [Fact]
    public void Render_data_flow_rollup_card_lists_all_adf_factory_names()
    {
        const string sharedHost = "mysql.partner.example";
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "source",
                    Label = "Source",
                    OrderKey = 0,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "application",
                    Label = "Application",
                    OrderKey = 1,
                },
            ],
            Nodes =
            [
                ..Enumerable.Range(0, 4).Select(index => new DiagramNode
                {
                    NodeId = $"mysql-link-{index}",
                    Label = $"mysql-link-{index}",
                    NodeType = "TopologyResource",
                    SubgraphId = "source",
                    OrderKey = index,
                    ExternalLinkedServiceType = "AzureMySql",
                    ExternalFactoryName = $"adf-factory-{index}",
                    ExternalTargetHost = sharedHost,
                }),
                new DiagramNode
                {
                    NodeId = "consumer-app",
                    Label = "consumer-app",
                    NodeType = "TopologyResource",
                    SubgraphId = "application",
                    OrderKey = 10,
                    ArmResourceType = "Microsoft.Web/sites",
                },
            ],
            Edges =
            [
                ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
                {
                    FromNodeId = $"mysql-link-{index}",
                    ToNodeId = "consumer-app",
                    Label = "reads",
                }),
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().Contain("4 MySQL links");
        result.Svg.Should().Contain("Factories adf-factory-0, adf-factory-1, and 2 more");
        result.Svg.Should().NotContain("Factory adf-factory-0");
    }

    [Fact]
    public void Render_data_flow_rollup_card_lists_all_distinct_external_target_hosts()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "source",
                    Label = "Source",
                    OrderKey = 0,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "application",
                    Label = "Application",
                    OrderKey = 1,
                },
            ],
            Nodes =
            [
                ..Enumerable.Range(0, 4).Select(index => new DiagramNode
                {
                    NodeId = $"mysql-link-{index}",
                    Label = $"mysql-link-{index}",
                    NodeType = "TopologyResource",
                    SubgraphId = "source",
                    OrderKey = index,
                    ExternalLinkedServiceType = "AzureMySql",
                    ExternalFactoryName = $"adf-factory-{index}",
                    ExternalTargetHost = $"mysql-{index}.partner.example",
                    ExternalIntegrationRuntime = index % 2 == 0 ? "managed" : "selfHostedIr",
                }),
                new DiagramNode
                {
                    NodeId = "consumer-app",
                    Label = "consumer-app",
                    NodeType = "TopologyResource",
                    SubgraphId = "application",
                    OrderKey = 10,
                    ArmResourceType = "Microsoft.Web/sites",
                },
            ],
            Edges =
            [
                ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
                {
                    FromNodeId = $"mysql-link-{index}",
                    ToNodeId = "consumer-app",
                    Label = "reads",
                }),
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().Contain("4 MySQL links");
        result.Svg.Should().Contain("Hosts mysql-0.partner.example, mysql-1.partner.example, and 2 more");
        result.Svg.Should().Contain("Runtimes managed, selfHostedIr");
        result.Svg.Should().NotContain("mysql-3.partner.example");
    }

    [Fact]
    public void Render_data_flow_rollup_card_surfaces_key_vault_when_any_member_uses_key_vault_host()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "source",
                    Label = "Source",
                    OrderKey = 0,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "application",
                    Label = "Application",
                    OrderKey = 1,
                },
            ],
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "mysql-link-0",
                    Label = "mysql-link-0",
                    NodeType = "TopologyResource",
                    SubgraphId = "source",
                    OrderKey = 0,
                    ExternalLinkedServiceType = "AzureMySql",
                    ExternalFactoryName = "adf-factory-0",
                    ExternalTargetHost = "mysql-0.partner.example",
                },
                ..Enumerable.Range(1, 3).Select(index => new DiagramNode
                {
                    NodeId = $"mysql-link-{index}",
                    Label = $"mysql-link-{index}",
                    NodeType = "TopologyResource",
                    SubgraphId = "source",
                    OrderKey = index,
                    ExternalLinkedServiceType = "AzureMySql",
                    ExternalFactoryName = $"adf-factory-{index}",
                    ExternalHostInKeyVault = true,
                }),
                new DiagramNode
                {
                    NodeId = "consumer-app",
                    Label = "consumer-app",
                    NodeType = "TopologyResource",
                    SubgraphId = "application",
                    OrderKey = 10,
                    ArmResourceType = "Microsoft.Web/sites",
                },
            ],
            Edges =
            [
                ..Enumerable.Range(0, 4).Select(index => new DiagramEdge
                {
                    FromNodeId = $"mysql-link-{index}",
                    ToNodeId = "consumer-app",
                    Label = "reads",
                }),
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().Contain("4 MySQL links");
        result.Svg.Should().Contain("mysql-0.partner.example");
        result.Svg.Should().Contain("Host in Key Vault");
    }

    [Fact]
    public void Render_data_flow_shows_adf_link_identity_lines()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "sftp-link",
                    Label = "hsag_sftp",
                    NodeType = "TopologyResource",
                    ExternalLinkedServiceType = "Sftp",
                    ExternalFactoryName = "adf-edw-hi-dev",
                    ExternalTargetHost = "files.partner.example",
                    ExternalIntegrationRuntime = "selfHostedIr",
                    SubgraphId = "source",
                },
                new DiagramNode
                {
                    NodeId = "mysql-keyvault-link",
                    Label = "azuremysql1",
                    NodeType = "TopologyResource",
                    ExternalLinkedServiceType = "AzureMySql",
                    ExternalFactoryName = "adf-edw-hi-tst",
                    ExternalHostInKeyVault = true,
                    SubgraphId = "source",
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().Contain("SFTP link");
        result.Svg.Should().Contain("Factory adf-edw-hi-dev");
        result.Svg.Should().Contain("files.partner.example");
        result.Svg.Should().Contain("Runtime selfHostedIr");
        result.Svg.Should().Contain("MySQL link");
        result.Svg.Should().Contain("Factory adf-edw-hi-tst");
        result.Svg.Should().Contain("Host in Key Vault");
        result.Svg.Should().NotContain("connectionString");
    }

    [Fact]
    public void Render_data_flow_shows_consumer_status_for_data_stores_only()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "storage-used",
                    Label = "storage-used",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "storage",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "storage-empty",
                    Label = "storage-empty",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "storage",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "app",
                    Label = "app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/sites",
                    SubgraphId = "application",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "factory",
                    Label = "factory",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.DataFactory/factories",
                    SubgraphId = "ingestion",
                    OrderKey = 3,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "storage-used",
                    ToNodeId = "app",
                    Label = "uses",
                },
                new DiagramEdge
                {
                    FromNodeId = "storage-used",
                    ToNodeId = "factory",
                    Label = "uses",
                },
            ],
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "storage",
                    Label = "Storage",
                    OrderKey = 0,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "application",
                    Label = "Application",
                    OrderKey = 1,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "ingestion",
                    Label = "Ingestion",
                    OrderKey = 2,
                },
            ],
        };

        DiagramForestLayoutResult dataFlowResult = renderer.Render(ast);

        dataFlowResult.Succeeded.Should().BeTrue(dataFlowResult.Error);
        dataFlowResult.Svg.Should().Contain("Used by 2");
        dataFlowResult.Svg.Should().Contain("No consumer found");

        ast.Title = "Azure inventory (FullSubscription)";
        DiagramForestLayoutResult fullSubscriptionResult = renderer.Render(ast);

        fullSubscriptionResult.Succeeded.Should().BeTrue(fullSubscriptionResult.Error);
        fullSubscriptionResult.Svg.Should().NotContain("Used by 2");
        fullSubscriptionResult.Svg.Should().NotContain("No consumer found");
        fullSubscriptionResult.Svg.Should().NotContain("data-flow-stage-summary");
    }

    [Fact]
    public void Render_data_flow_paints_stage_summary_above_columns()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "data-flow-stage-source", Label = "Source", OrderKey = 0 },
                new DiagramSubgraph { SubgraphId = "data-flow-stage-ingestion", Label = "Ingestion", OrderKey = 1 },
                new DiagramSubgraph { SubgraphId = "data-flow-stage-storage", Label = "Storage", OrderKey = 2 },
                new DiagramSubgraph { SubgraphId = "data-flow-stage-consumer", Label = "Consumer", OrderKey = 3 },
            ],
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "source-a",
                    Label = "source-a",
                    NodeType = "TopologyResource",
                    SubgraphId = "data-flow-stage-source",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "source-b",
                    Label = "source-b",
                    NodeType = "TopologyResource",
                    SubgraphId = "data-flow-stage-source",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "ingestion",
                    Label = "ingestion",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.DataFactory/factories",
                    SubgraphId = "data-flow-stage-ingestion",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "storage-used",
                    Label = "storage-used",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "data-flow-stage-storage",
                    OrderKey = 3,
                },
                new DiagramNode
                {
                    NodeId = "storage-empty-a",
                    Label = "storage-empty-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "data-flow-stage-storage",
                    OrderKey = 4,
                },
                new DiagramNode
                {
                    NodeId = "storage-empty-b",
                    Label = "storage-empty-b",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "data-flow-stage-storage",
                    OrderKey = 5,
                },
                new DiagramNode
                {
                    NodeId = "consumer",
                    Label = "consumer",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/sites",
                    SubgraphId = "data-flow-stage-consumer",
                    OrderKey = 6,
                },
                new DiagramNode
                {
                    NodeId = "not-staged",
                    Label = "not-staged",
                    NodeType = "TopologyResource",
                    OrderKey = 7,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "storage-used", ToNodeId = "consumer", Label = "uses" },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().Contain(
            "2 Source → 1 Ingestion → 3 Storage (1 used, 2 no consumer found) → 1 Consumer · 1 not staged");
    }

    [Fact]
    public void Resolve_row_width_limit_keeps_three_cell_floor_and_scales_large_plates()
    {
        DiagramForestLayoutOptions options = new()
        {
            MaxNodeWidth = 280,
            ComponentHorizontalGap = 48,
            ComponentVerticalGap = 40,
            PlateTargetAspect = 1.6d,
        };

        DiagramForestLayoutSvgRenderer.ResolveRowWidthLimit(
            [(280d, 200d)],
            options).Should().Be(840d);

        double expected = Math.Sqrt(12 * (280d + 48d) * (200d + 40d) * 1.6d);
        DiagramForestLayoutSvgRenderer.ResolveRowWidthLimit(
            Enumerable.Repeat((280d, 200d), 12),
            options).Should().BeApproximately(expected, 0.001d);
    }

    [Fact]
    public void Render_network_inventory_adds_vnet_frame_without_subscription_frame()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (Network)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet",
                    Label = "vnet-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 1,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotContain("class=\"subscription-frame\"");
        result.Svg.Should().Contain("class=\"vnet-frame\"");
    }

    [Fact]
    public void Render_resource_group_inventory_does_not_add_subscription_frame()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (ResourceGroup) — rg-app",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotContain("class=\"subscription-frame\"");
    }

    [Fact]
    public void Render_owner_shape_executive_vnets_use_content_sized_node_widths()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        List<double> cardWidths = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node-card", StringComparison.Ordinal))
            .Select(element => double.Parse(element.Attribute("width")?.Value ?? "0", CultureInfo.InvariantCulture))
            .ToList();

        cardWidths.Should().HaveCount(11);
        cardWidths.Should().OnlyContain(width => width >= 160 && width <= 280);
        cardWidths.Any(width => width < 400).Should().BeTrue();
        cardWidths.Max().Should().BeLessThanOrEqualTo(280);

        List<string> rectFills = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node-card", StringComparison.Ordinal))
            .Select(element => element.Attribute("fill")?.Value ?? string.Empty)
            .ToList();

        rectFills.Should().OnlyContain(fill => fill == ArchitectureDiagramMermaidPalette.LightNodeFill);
        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node-accent", StringComparison.Ordinal))
            .Select(element => element.Attribute("fill")?.Value ?? string.Empty)
            .Should()
            .OnlyContain(fill => fill == "#0f766e");
    }

    [Fact]
    public void Render_owner_shape_executive_vnets_places_eleven_nodes_with_tight_viewbox()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotBeNullOrWhiteSpace();
        result.Svg.Should().Contain("g class=\"node\"");

        XDocument document = XDocument.Parse(result.Svg!);
        XElement? root = document.Root;
        root.Should().NotBeNull();
        root!.Name.LocalName.Should().Be("svg");

        int nodeCount = root.Descendants().Count(element =>
            string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
            && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal));
        nodeCount.Should().Be(11);

        int frameCount = root.Descendants().Count(element =>
            string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
            && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal));
        frameCount.Should().Be(11);

        int edgePathCount = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge", StringComparison.Ordinal))
            .SelectMany(group => group.Elements())
            .Count(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal));
        edgePathCount.Should().Be(6);

        int straightEdgeLineCount = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge", StringComparison.Ordinal))
            .SelectMany(group => group.Elements())
            .Count(element => string.Equals(element.Name.LocalName, "line", StringComparison.Ordinal));
        straightEdgeLineCount.Should().Be(0);

        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-label", StringComparison.Ordinal))
            .SelectMany(group => group.Elements())
            .Count(element => string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals(element.Value, "peering", StringComparison.Ordinal))
            .Should()
            .Be(6);

        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal))
            .Select(element => element.Attribute("stroke-dasharray")?.Value ?? string.Empty)
            .Should()
            .OnlyContain(value => value == "6 4");

        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal))
            .Select(element => element.Attribute("marker-end")?.Value ?? string.Empty)
            .Should()
            .OnlyContain(value => value.Contains("al-edge-arrow", StringComparison.Ordinal));

        result.Svg.Should().Contain("class=\"legend\"");
        result.Svg.Should().Contain("Left edge");
        result.Svg.Should().NotContain("Eyebrow color");
        result.Svg.Should().Contain("Network");
        result.Svg.Should().Contain("Peering");

        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal))
            .Select(element => element.Attribute("d")?.Value ?? string.Empty)
            .Where(pathData => pathData.Length > 0)
            .Should()
            .NotContain(pathData => IsDiagonalChordPath(pathData));

        string[] viewBoxParts = (root.Attribute("viewBox")?.Value ?? string.Empty)
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        viewBoxParts.Should().HaveCount(4);

        double viewBoxWidth = double.Parse(viewBoxParts[2], CultureInfo.InvariantCulture);
        double viewBoxHeight = double.Parse(viewBoxParts[3], CultureInfo.InvariantCulture);

        viewBoxWidth.Should().BeLessThan(3200);
        viewBoxHeight.Should().BeLessThan(900);
    }

    [Fact]
    public void Render_five_node_chain_uses_left_to_right_ranks()
    {
        GraphSnapshot graph = BuildChainGraph(nodeCount: 5);
        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        List<(double X, double Y)> nodes = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal))
            .Select(element => (
                X: ParseTranslateX(element.Attribute("transform")?.Value),
                Y: ParseTranslateY(element.Attribute("transform")?.Value)))
            .OrderBy(node => node.X)
            .ToList();

        nodes.Should().HaveCount(5);
        nodes[0].X.Should().BeLessThan(nodes[1].X);
        nodes[1].X.Should().BeLessThan(nodes[2].X);
        nodes[2].X.Should().BeLessThan(nodes[3].X);
        nodes[3].X.Should().BeLessThan(nodes[4].X);
        nodes.Select(node => node.Y).Distinct().Count().Should().Be(1);
    }

    [Fact]
    public void Render_cross_resource_group_pair_places_from_left_of_to_when_order_key_is_inverted()
    {
        DiagramAst ast = new()
        {
            Title = "ltr-pair",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "adf",
                    Label = "adf-edw-hi-dev",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.DataFactory/factories",
                    ArmResourceGroup = "rg-data-factory",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "stnprdhiwus001",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    ArmResourceGroup = "rg-storage",
                    OrderKey = 0,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "adf",
                    ToNodeId = "storage",
                    Label = "likely connected to",
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotBeNullOrWhiteSpace();

        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        double adfX = ParseTranslateX(FindNodeGroup(root, "adf").Attribute("transform")?.Value);
        double storageX = ParseTranslateX(FindNodeGroup(root, "storage").Attribute("transform")?.Value);

        adfX.Should().BeLessThan(storageX);
    }

    [Fact]
    public void Render_owner_shape_separates_component_columns()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        List<double> nodeXs = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal))
            .Select(element => ParseTranslateX(element.Attribute("transform")?.Value))
            .OrderBy(x => x)
            .ToList();

        nodeXs.Should().HaveCount(11);
        nodeXs.Distinct().Count().Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void Render_uses_pictograms_and_bold_wrapped_names()
    {
        DiagramAst ast = new()
        {
            Title = "labels",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-userprovision-hi-nonprod01",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "db-1",
                    Label = "sqldb-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Sql/servers/databases",
                    OrderKey = 1,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("font-weight=\"700\"");
        result.Svg.Should().Contain("class=\"pictogram\"");
        result.Svg.Should().Contain("data-kind=\"Compute\"");
        result.Svg.Should().Contain("data-kind=\"Data\"");
        result.Svg.Should().Contain("<title>vm-userprovision-hi-nonprod01 (Virtual machine)</title>");
        result.Svg.Should().Contain("<title>sqldb-app (SQL database)</title>");
        result.Svg.Should().Contain("<tspan");
        result.Svg.Should().Contain("text-anchor=\"start\"");
        result.Svg.Should().Contain("class=\"node-card\"");
        result.Svg.Should().Contain($"fill=\"{ArchitectureDiagramMermaidPalette.LightNodeFill}\"");
    }

    [Fact]
    public void Render_frames_each_named_resource_group_including_singletons()
    {
        DiagramAst ast = new()
        {
            Title = "resource-groups",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app-prod",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "db-1",
                    Label = "sqldb-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Sql/servers/databases",
                    ArmResourceGroup = "rg-data-prod",
                    OrderKey = 1,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        result.Succeeded.Should().BeTrue();
        root.Descendants()
            .Count(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal))
            .Should()
            .Be(2);
        result.Svg.Should().Contain("rg-app-prod");
        result.Svg.Should().Contain("rg-data-prod");
        result.Svg.Should().Contain("font-weight=\"700\"");
        result.Svg.Should().Contain("<title>vm-app (Virtual machine) · rg-app-prod</title>");
        result.Svg.Should().Contain("<title>sqldb-app (SQL database) · rg-data-prod</title>");
        CountRgCaptionTexts(root, "rg-app-prod").Should().Be(0);
        CountRgCaptionTexts(root, "rg-data-prod").Should().Be(0);
    }

    [Fact]
    public void Render_frames_shared_resource_groups_and_suppresses_duplicate_captions()
    {
        DiagramAst ast = new()
        {
            Title = "rg-frame",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-app-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app-prod",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-2",
                    Label = "vm-app-b",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app-prod",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "db-1",
                    Label = "sqldb-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Sql/servers/databases",
                    ArmResourceGroup = "rg-data-prod",
                    OrderKey = 2,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-1", ToNodeId = "vm-2", Label = "connects" },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        root.Descendants()
            .Count(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal))
            .Should()
            .Be(2);
        result.Svg.Should().Contain("rg-app-prod");
        result.Svg.Should().Contain("rg-data-prod");
        result.Svg.Should().Contain("font-weight=\"700\"");
        CountRgCaptionTexts(root, "rg-app-prod").Should().Be(0);
        CountRgCaptionTexts(root, "rg-data-prod").Should().Be(0);
        root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && element.Ancestors()
                    .Any(ancestor =>
                        string.Equals(ancestor.Name.LocalName, "g", StringComparison.Ordinal)
                        && string.Equals((string?)ancestor.Attribute("class"), "rg-frame", StringComparison.Ordinal)))
            .Select(element => element.Attribute("font-weight")?.Value)
            .Should()
            .OnlyContain(weight => weight == "700");
    }

    [Fact]
    public void Render_omits_resource_group_line_when_arm_resource_group_is_missing()
    {
        DiagramAst ast = new()
        {
            Title = "no-group",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);

        result.Succeeded.Should().BeTrue();
        document.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal))
            .SelectMany(node => node.Descendants())
            .Where(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals(element.Attribute("font-weight")?.Value, "400", StringComparison.Ordinal))
            .Should()
            .BeEmpty();
        result.Svg.Should().Contain("<title>vm-app (Virtual machine)</title>");
    }

    [Fact]
    public void Render_private_endpoint_target_shows_lock_without_edge_label()
    {
        DiagramAst ast = new()
        {
            Title = "private-endpoint",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "pe-1",
                    Label = "pe-sql",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/privateEndpoints",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "sql-1",
                    Label = "mysql-bam-hi-dev",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.DBforMySQL/flexibleServers",
                    HasPrivateEndpointAccess = true,
                    OrderKey = 1,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "pe-1",
                    ToNodeId = "sql-1",
                    Label = string.Empty,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"private-endpoint-access\"");
        result.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        result.Svg.Should().Contain("class=\"private-endpoint-arrow\"");
        result.Svg.Should().Contain("Private endpoint access");
        result.Svg.Should().NotContain("class=\"edge-label\"");
        ParsePrivateEndpointLockTranslateX(result.Svg).Should().BeLessThan(ParsePrivateEndpointArrowStartX(result.Svg));
    }

    [Fact]
    public void Render_empty_ast_fails_soft()
    {
        DiagramForestLayoutResult result = renderer.Render(new DiagramAst { Title = "empty" });

        result.Succeeded.Should().BeFalse();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    private static bool IsDiagonalChordPath(string pathData)
    {
        bool hasLineStep = pathData.Contains(" L ", StringComparison.Ordinal);
        bool hasHorizontalStep = pathData.Contains(" H ", StringComparison.Ordinal);
        bool hasVerticalStep = pathData.Contains(" V ", StringComparison.Ordinal);

        return hasLineStep && !hasHorizontalStep && !hasVerticalStep;
    }

    private static int CountRgCaptionTexts(XElement root, string resourceGroup)
    {
        return root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals(element.Attribute("font-weight")?.Value, "400", StringComparison.Ordinal)
                && string.Equals(element.Value, resourceGroup, StringComparison.Ordinal))
            .Count();
    }

    private static XElement FindNodeGroup(XElement root, string nodeId)
    {
        string sanitized = MermaidIdSanitizer.Sanitize(nodeId);
        XElement? group = root.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("id"), $"node-{sanitized}", StringComparison.Ordinal));

        group.Should().NotBeNull();

        return group!;
    }

    private static double ParseTranslateX(string? transform)
    {
        if (string.IsNullOrWhiteSpace(transform) || !transform.StartsWith("translate(", StringComparison.Ordinal))
        {
            return double.NaN;
        }

        string inner = transform["translate(".Length..].TrimEnd(')');
        string[] parts = inner.Split(',');

        return double.Parse(parts[0], CultureInfo.InvariantCulture);
    }

    private static double ParseTranslateY(string? transform)
    {
        if (string.IsNullOrWhiteSpace(transform) || !transform.StartsWith("translate(", StringComparison.Ordinal))
        {
            return double.NaN;
        }

        string inner = transform["translate(".Length..].TrimEnd(')');
        string[] parts = inner.Split(',');

        if (parts.Length < 2)
        {
            return double.NaN;
        }

        return double.Parse(parts[1], CultureInfo.InvariantCulture);
    }

    private static double ParsePrivateEndpointLockTranslateX(string svg)
    {
        XElement root = XElement.Parse(svg);
        XElement? lockGroup = root.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "private-endpoint-lock", StringComparison.Ordinal));

        lockGroup.Should().NotBeNull();

        return ParseTranslateX(lockGroup!.Attribute("transform")?.Value);
    }

    private static double ParsePrivateEndpointArrowStartX(string svg)
    {
        XElement root = XElement.Parse(svg);
        XElement? arrowPath = root.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && element.Parent is not null
                && string.Equals((string?)element.Parent.Attribute("class"), "private-endpoint-arrow", StringComparison.Ordinal));

        arrowPath.Should().NotBeNull();

        string? pathData = arrowPath!.Attribute("d")?.Value;
        pathData.Should().NotBeNullOrWhiteSpace();

        string[] tokens = pathData!.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return double.Parse(tokens[1], CultureInfo.InvariantCulture);
    }

    private static GraphSnapshot BuildChainGraph(int nodeCount)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];

        for (int index = 0; index < nodeCount; index++)
        {
            string nodeId = $"vm-{index}";
            string armId =
                $"/subscriptions/sub/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/vm-{index}";
            GraphNode node = new()
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = $"vm-{index}",
                SourceType = "azure-inventory-snapshot",
                SourceId = armId,
            };
            node.Properties["arm.id"] = armId;
            node.Properties["arm.type"] = "Microsoft.Compute/virtualMachines";
            node.Properties["arm.resourceGroup"] = "rg-app";
            node.Properties["arm.subscriptionId"] = "sub";
            nodes.Add(node);

            if (index > 0)
            {
                edges.Add(new GraphEdge
                {
                    EdgeId = $"edge-{index}",
                    FromNodeId = $"vm-{index - 1}",
                    ToNodeId = nodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                });
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }

    [Fact]
    public void Render_declared_edge_uses_four_three_dasharray()
    {
        DiagramAst ast = new()
        {
            Title = "declared-edge",
            Nodes =
            [
                new DiagramNode { NodeId = "app", Label = "app", NodeType = "app" },
                new DiagramNode { NodeId = "sql", Label = "sql", NodeType = "sql" },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "sql",
                    Label = "declared · connects",
                    ProvenanceKind = "HumanAssertion",
                    InferenceSource = GraphEdgeInferenceSources.HumanDeclaredConnection,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);

        document.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal))
            .Select(element => element.Attribute("stroke-dasharray")?.Value ?? string.Empty)
            .Should()
            .ContainSingle()
            .Which.Should()
            .Be("4 3");
    }

    [Fact]
    public void Render_same_label_component_draws_every_connector()
    {
        const string sharedLabel = "likely · Likely connected to";
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "data-flow-stage-source", Label = "Source", OrderKey = 0 },
                new DiagramSubgraph { SubgraphId = "data-flow-stage-ingestion", Label = "Ingestion", OrderKey = 1 },
            ],
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "sftp-a",
                    Label = "sftp_ahcccs",
                    NodeType = "TopologyResource",
                    SubgraphId = "data-flow-stage-source",
                    ArmResourceGroup = "rg-data",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "sftp-b",
                    Label = "hsag_sftp",
                    NodeType = "TopologyResource",
                    SubgraphId = "data-flow-stage-source",
                    ArmResourceGroup = "rg-data",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "adf",
                    Label = "adf-factory",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.DataFactory/factories",
                    SubgraphId = "data-flow-stage-ingestion",
                    ArmResourceGroup = "rg-data",
                    OrderKey = 2,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "sftp-a",
                    ToNodeId = "adf",
                    Label = sharedLabel,
                    ProvenanceKind = "DeterministicInference",
                },
                new DiagramEdge
                {
                    FromNodeId = "sftp-b",
                    ToNodeId = "adf",
                    Label = sharedLabel,
                    ProvenanceKind = "DeterministicInference",
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        List<XElement> paths = document.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal))
            .ToList();

        result.Succeeded.Should().BeTrue();
        paths.Should().HaveCount(2);
        paths.Should().OnlyContain(path =>
            string.Equals((string?)path.Attribute("vector-effect"), "non-scaling-stroke", StringComparison.Ordinal));
        paths.Select(path => (string?)path.Parent?.Attribute("data-from"))
            .Should()
            .OnlyHaveUniqueItems();
        paths.Select(path => (string?)path.Parent?.Attribute("data-to"))
            .Distinct()
            .Should()
            .ContainSingle();
    }
}
