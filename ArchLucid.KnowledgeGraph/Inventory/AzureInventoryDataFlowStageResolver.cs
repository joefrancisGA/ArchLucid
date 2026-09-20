using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Maps ARM resource types (and external ADF linked-service nodes) to data-flow pipeline stages.
/// </summary>
public static class AzureInventoryDataFlowStageResolver
{
    private const string MicrosoftNetworkProviderPrefix = "Microsoft.Network/";

    private const string MicrosoftWebProviderPrefix = "Microsoft.Web/";

    private const string MicrosoftAppProviderPrefix = "Microsoft.App/";

    private const string MicrosoftEventGridProviderPrefix = "Microsoft.EventGrid/";

    private const string MicrosoftLogicProviderPrefix = "Microsoft.Logic/";

    private const string MicrosoftServiceBusProviderPrefix = "Microsoft.ServiceBus/";

    private const string MicrosoftEventHubProviderPrefix = "Microsoft.EventHub/";

    private const string MicrosoftKeyVaultProviderPrefix = "Microsoft.KeyVault/";

    private const string MicrosoftDataFactoryProviderPrefix = "Microsoft.DataFactory/";

    private const string MicrosoftSynapseProviderPrefix = "Microsoft.Synapse/";

    private const string MicrosoftDatabricksProviderPrefix = "Microsoft.Databricks/";

    private const string MicrosoftPowerBiProviderPrefix = "Microsoft.PowerBI/";

    private const string MicrosoftFabricProviderPrefix = "Microsoft.Fabric/";

    private const string MicrosoftCognitiveServicesProviderPrefix = "Microsoft.CognitiveServices/";

    private const string MicrosoftSearchProviderPrefix = "Microsoft.Search/";

    public static string? Resolve(string? resourceType, bool isExternalSource)
    {
        if (isExternalSource)
        {
            return AzureInventoryDataFlowStageNames.Source;
        }

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return null;
        }

        if (resourceType.StartsWith(MicrosoftNetworkProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (resourceType.StartsWith(MicrosoftWebProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftAppProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Application;
        }

        if (resourceType.StartsWith(MicrosoftEventGridProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftLogicProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Ingestion;
        }

        if (resourceType.StartsWith(MicrosoftServiceBusProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftEventHubProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftKeyVaultProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Storage;
        }

        if (resourceType.StartsWith(MicrosoftDataFactoryProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Ingestion;
        }

        if (resourceType.StartsWith("Microsoft.Sql/", StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith("Microsoft.DocumentDB/", StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith("Microsoft.DBfor", StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith("Microsoft.Storage/", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Storage;
        }

        if (resourceType.StartsWith(MicrosoftSynapseProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftDatabricksProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftCognitiveServicesProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Transform;
        }

        if (resourceType.StartsWith(MicrosoftSearchProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Storage;
        }

        if (resourceType.StartsWith(MicrosoftPowerBiProviderPrefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(MicrosoftFabricProviderPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryDataFlowStageNames.Consumer;
        }

        return null;
    }

    public static string? Resolve(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(node.NodeId)
            || (node.Properties != null
                && node.Properties.TryGetValue(
                    AzureInventoryAdfExternalSourceNodeFactory.ExternalSourcePropertyKey,
                    out string? externalFlag)
                && string.Equals(
                    externalFlag,
                    AzureInventoryAdfExternalSourceNodeFactory.ExternalSourcePropertyValue,
                    StringComparison.OrdinalIgnoreCase)))
        {
            return AzureInventoryDataFlowStageNames.Source;
        }

        string armType = ReadArmType(node);

        return Resolve(armType, isExternalSource: false);
    }

    public static bool IsDataArchitectureNode(GraphNode node)
    {
        string? stage = Resolve(node);

        return stage is not null;
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties != null
            && node.Properties.TryGetValue("arm.type", out string? armType)
            && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType;
    }
}
