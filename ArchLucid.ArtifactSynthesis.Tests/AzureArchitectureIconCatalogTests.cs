using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class AzureArchitectureIconCatalogTests
{
    [Fact]
    public void Catalog_resolves_official_svg_for_mapped_resource_and_keeps_unknown_types_on_pictogram_fallback()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

        AzureArchitectureIconCatalogEntry? virtualMachine =
            catalog.Resolve("Microsoft.Compute/virtualMachines");
        AzureArchitectureIconCatalogEntry? unknown =
            catalog.Resolve("Microsoft.Example/unknown");

        virtualMachine.Should().NotBeNull();
        virtualMachine!.SvgMarkup.Should().Contain("<svg");
        virtualMachine.SvgMarkup.Should().NotContain("data:image/png");
        unknown.Should().BeNull();
    }

    [Fact]
    public void Catalog_resolves_function_app_kind_instead_of_generic_app_service()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

        catalog.Resolve("Microsoft.Web/sites", "functionapp")!.Service.Should().Be("Function Apps");
        catalog.Resolve("Microsoft.Web/sites", "functionapp,linux")!.Service.Should().Be("Function Apps");
        catalog.Resolve("Microsoft.Web/sites")!.Service.Should().Be("App Services");
        catalog.Resolve("Microsoft.Web/sites", "app,linux")!.Service.Should().Be("App Services");
    }

    [Fact]
    public void Catalog_uses_default_icon_when_resource_kind_is_present()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

        catalog.Resolve("Microsoft.Storage/storageAccounts", "StorageV2")!.Service.Should().Be("Storage Accounts");
        catalog.Resolve("Microsoft.DocumentDB/databaseAccounts", "GlobalDocumentDB")!.Service.Should().Be("Azure Cosmos DB");
    }

    [Fact]
    public void Catalog_resolves_named_services_from_official_svg_pack()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();
        (string ArmType, string Service)[] expected =
        [
            ("Microsoft.Compute/disks", "Disks"),
            ("Microsoft.ContainerService/managedClusters", "Kubernetes Services"),
            ("Microsoft.Web/serverFarms", "App Service Plans"),
            ("Microsoft.Sql/servers", "SQL Server"),
            ("Microsoft.Sql/managedInstances", "SQL Managed Instance"),
            ("Microsoft.DBforPostgreSQL/flexibleServers", "Azure Database for PostgreSQL"),
            ("Microsoft.DBforPostgreSQL/servers", "Azure Database for PostgreSQL"),
            ("Microsoft.DBforMySQL/flexibleServers", "Azure Database for MySQL"),
            ("Microsoft.DBforMySQL/servers", "Azure Database for MySQL"),
            ("Microsoft.Cache/Redis", "Azure Cache for Redis"),
            ("Microsoft.DataFactory/factories", "Data Factory"),
            ("Microsoft.Synapse/workspaces", "Azure Synapse Analytics"),
            ("Microsoft.Databricks/workspaces", "Azure Databricks"),
        ];

        foreach ((string armType, string service) in expected)
        {
            AzureArchitectureIconCatalogEntry entry = catalog.Resolve(armType)
                ?? throw new InvalidOperationException($"No official icon resolved for {armType}.");

            entry.Service.Should().Be(service);
            entry.SvgMarkup.Should().Contain("<svg");
            entry.SvgMarkup.Should().NotContain("data:image/png");
        }

        catalog.Resolve("Microsoft.PowerBIDedicated/capacities").Should().BeNull();
        catalog.Resolve("Microsoft.Fabric/capacities").Should().BeNull();
    }

    [Fact]
    public void Catalog_resolves_network_services_from_official_svg_pack()
    {
        AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();
        (string ArmType, string Service)[] expected =
        [
            ("Microsoft.Network/networkInterfaces", "Network Interfaces"),
            ("Microsoft.Network/publicIPAddresses", "Public IP Addresses"),
            ("Microsoft.Network/loadBalancers", "Load Balancers"),
            ("Microsoft.Network/privateEndpoints", "Private Endpoints"),
            ("Microsoft.Network/routeTables", "Route Tables"),
            ("Microsoft.Network/virtualNetworks/subnets", "Subnet"),
            ("Microsoft.Network/applicationGateways", "Application Gateways"),
            ("Microsoft.Network/bastionHosts", "Bastions"),
            ("Microsoft.Network/azureFirewalls", "Firewalls"),
            ("Microsoft.Network/natGateways", "NAT"),
            ("Microsoft.Network/dnszones", "DNS Zones"),
            ("Microsoft.Network/virtualNetworkGateways", "Virtual Network Gateways"),
            ("Microsoft.Network/localNetworkGateways", "Local Network Gateways"),
            ("Microsoft.Network/expressRouteCircuits", "ExpressRoute Circuits"),
            ("Microsoft.Network/applicationSecurityGroups", "Application Security Groups"),
            ("Microsoft.Network/publicIPPrefixes", "Public IP Prefixes"),
            ("Microsoft.Network/networkWatchers", "Network Watcher"),
            ("Microsoft.Network/ddosProtectionPlans", "DDoS Protection Plans"),
        ];

        foreach ((string armType, string service) in expected)
        {
            AzureArchitectureIconCatalogEntry entry = catalog.Resolve(armType)
                ?? throw new InvalidOperationException($"No official icon resolved for {armType}.");

            entry.Service.Should().Be(service);
            entry.SvgMarkup.Should().Contain("<svg");
            entry.SvgMarkup.Should().NotContain("data:image/png");
        }

        catalog.Resolve("Microsoft.Network/virtualNetworks")!.Service.Should().Be("Virtual Networks");
        catalog.Resolve("Microsoft.Network/networkSecurityGroups")!.Service.Should().Be("Network Security Groups");
        catalog.Resolve("Microsoft.Network/privateDnsZones").Should().BeNull();
    }

    [Fact]
    public void Renderer_emits_official_svg_group_and_preserves_category_pictogram_fallback()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (Network)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "disk",
                    Label = "disk-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/disks",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "load-balancer",
                    Label = "load-balancer-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/loadBalancers",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "unknown",
                    Label = "unknown-resource",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Example/unknown",
                    OrderKey = 3,
                },
                new DiagramNode
                {
                    NodeId = "private-dns",
                    Label = "private-dns",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/privateDnsZones",
                    OrderKey = 4,
                },
            ],
        };

        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"azure-icon\"");
        result.Svg.Should().Contain("data-file=\"Svg/virtual-machine.svg\"");
        result.Svg.Should().Contain("data-file=\"Svg/disk.svg\"");
        result.Svg.Should().Contain("data-file=\"Svg/load-balancer.svg\"");
        result.Svg.Should().Contain("class=\"pictogram\"");
        result.Svg.Should().NotContain("data:image/png");
        result.Svg.Should().NotContain("https://");
    }
}
