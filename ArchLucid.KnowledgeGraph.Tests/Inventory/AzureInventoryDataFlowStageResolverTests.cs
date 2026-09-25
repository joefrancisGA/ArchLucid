using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Inventory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDataFlowStageResolverTests
{
    [Theory]
    [InlineData("Microsoft.DataFactory/factories", AzureInventoryDataFlowStageNames.Ingestion)]
    [InlineData("Microsoft.Web/sites", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.App/containerApps", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.Network/applicationGateways", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.Network/azureFirewalls", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.Network/frontDoors", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.Cdn/profiles", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.Network/applicationGateways/httpListeners", null)]
    [InlineData("Microsoft.Cdn/profiles/afdEndpoints", null)]
    [InlineData("Microsoft.EventGrid/topics", AzureInventoryDataFlowStageNames.Ingestion)]
    [InlineData("Microsoft.ServiceBus/namespaces/topics", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Sql/servers", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Storage/storageAccounts", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.DocumentDB/databaseAccounts", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Synapse/workspaces", AzureInventoryDataFlowStageNames.Transform)]
    [InlineData("Microsoft.Databricks/workspaces", AzureInventoryDataFlowStageNames.Transform)]
    [InlineData("Microsoft.CognitiveServices/accounts", AzureInventoryDataFlowStageNames.Transform)]
    [InlineData("Microsoft.Search/searchServices", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Network/virtualNetworks", null)]
    [InlineData("Microsoft.Compute/virtualMachines", null)]
    [InlineData("Microsoft.ContainerRegistry/registries", null)]
    [InlineData("Microsoft.KeyVault/vaults", null)]
    [InlineData("Microsoft.KeyVault/managedHSMs", null)]
    [InlineData("Microsoft.HardwareSecurityModules/dedicatedHSMs", null)]
    [InlineData("Microsoft.Portal/consoles", null)]
    [InlineData("Microsoft.CloudShell/operations", null)]
    [InlineData("Microsoft.Network/bastionHosts", null)]
    [InlineData("Microsoft.ADHybridHealthService/services", null)]
    [InlineData("Microsoft.AzureActiveDirectory/b2cDirectories", null)]
    [InlineData("Microsoft.AAD/domainServices", null)]
    [InlineData("Microsoft.Security/pricings", null)]
    [InlineData("Microsoft.Security/advancedThreatProtectionSettings", null)]
    [InlineData("Microsoft.WindowsDefenderATP/machines", null)]
    [InlineData("Microsoft.Sql/servers/advancedThreatProtectionSettings", null)]
    [InlineData("Microsoft.DevTestLab/labs", null)]
    [InlineData("Microsoft.Insights/activityLogAlerts", null)]
    [InlineData("Microsoft.Insights/metricAlerts", null)]
    [InlineData("Microsoft.AlertsManagement/smartDetectorAlertRules", null)]
    [InlineData("Microsoft.Automation/automationAccounts", null)]
    [InlineData("Microsoft.Automation/automationAccounts/runbooks", null)]
    [InlineData("Microsoft.Compute/virtualMachineScaleSets", null)]
    [InlineData("Microsoft.Purview/accounts", null)]
    [InlineData("Microsoft.SecurityInsights/alertRules", null)]
    [InlineData("Microsoft.OperationsManagement/solutions", null)]
    [InlineData("Microsoft.ContainerInstance/containerGroups", null)]
    public void Resolve_maps_arm_types_to_stages(string armType, string? expectedStage)
    {
        AzureInventoryDataFlowStageResolver.Resolve(armType, isExternalSource: false)
            .Should()
            .Be(expectedStage);
    }

    [Fact]
    public void Resolve_omits_cloud_shell_storage_accounts_and_keeps_other_storage()
    {
        GraphNode cloudShell = new()
        {
            NodeId = "cs-storage",
            NodeType = "topology-resource",
            Label = "cs2100120050e1d7e42",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.type"] = "Microsoft.Storage/storageAccounts",
                ["arm.resourceGroup"] = "cloud-shell-storage-eastus",
            },
        };

        GraphNode dataLake = new()
        {
            NodeId = "adls",
            NodeType = "topology-resource",
            Label = "adls-raw",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.type"] = "Microsoft.Storage/storageAccounts",
                ["arm.resourceGroup"] = "rg-data",
            },
        };

        AzureInventoryDataFlowStageResolver.Resolve(cloudShell).Should().BeNull();
        AzureInventoryDataFlowStageResolver.Resolve(dataLake)
            .Should()
            .Be(AzureInventoryDataFlowStageNames.Storage);
    }

    [Fact]
    public void Resolve_external_source_flag_returns_source_even_when_arm_type_empty()
    {
        AzureInventoryDataFlowStageResolver.Resolve(string.Empty, isExternalSource: true)
            .Should()
            .Be(AzureInventoryDataFlowStageNames.Source);
    }

    [Fact]
    public void OrderedStages_places_application_immediately_after_source()
    {
        int sourceIndex = AzureInventoryDataFlowStageNames.OrderedStages
            .Select((stage, index) => (stage, index))
            .Single(pair => pair.stage == AzureInventoryDataFlowStageNames.Source)
            .index;
        int applicationIndex = AzureInventoryDataFlowStageNames.OrderedStages
            .Select((stage, index) => (stage, index))
            .Single(pair => pair.stage == AzureInventoryDataFlowStageNames.Application)
            .index;

        applicationIndex.Should().Be(sourceIndex + 1);
    }
}
