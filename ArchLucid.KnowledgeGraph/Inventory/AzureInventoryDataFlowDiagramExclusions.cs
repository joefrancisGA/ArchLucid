namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     ARM types omitted from data flow diagrams. These resources are not pipeline stages
///     (source, ingest, store, transform, consume).
/// </summary>
public static class AzureInventoryDataFlowDiagramExclusions
{
    private const string CloudShellStorageResourceGroupPrefix = "cloud-shell-storage";

    private const string AdvancedThreatProtectionSettingsSegment = "/advancedThreatProtectionSettings";

    /// <summary>
    ///     Whole resource providers. Child types under the provider are omitted too.
    /// </summary>
    private static readonly string[] ExcludedProviderPrefixes =
    [
        // Container Registry
        "Microsoft.ContainerRegistry/",
        // Azure Key Vault and Azure Managed HSM
        "Microsoft.KeyVault/",
        "Microsoft.HardwareSecurityModules/",
        // Azure Cloud Shell console metadata
        "Microsoft.CloudShell/",
        // Active Directory Domain Services
        "Microsoft.AAD/",
        // Microsoft Entra ID and Entra ID B2C
        "Microsoft.ADHybridHealthService/",
        "Microsoft.AzureActiveDirectory/",
        // Microsoft Defender for Cloud
        "Microsoft.Security/",
        // Microsoft Sentinel
        "Microsoft.SecurityInsights/",
        // Advanced Threat Protection
        "Microsoft.WindowsDefenderATP/",
        // Azure DevTest Labs
        "Microsoft.DevTestLab/",
        // Azure Alerts
        "Microsoft.AlertsManagement/",
        // Azure Automation and Automation Runbook
        "Microsoft.Automation/",
        // Microsoft Purview
        "Microsoft.Purview/",
        // Azure Container Instances
        "Microsoft.ContainerInstance/",
    ];

    /// <summary>
    ///     Specific types whose provider also contains resources that can stay on a data flow diagram.
    /// </summary>
    private static readonly string[] ExcludedArmTypePrefixes =
    [
        // Azure Bastion
        "Microsoft.Network/bastionHosts",
        // Azure Cloud Shell
        "Microsoft.Portal/consoles",
        // Virtual Machine Scale Sets
        "Microsoft.Compute/virtualMachineScaleSets",
        // Azure Alerts
        "Microsoft.Insights/activityLogAlerts",
        "Microsoft.Insights/metricAlerts",
        "Microsoft.Insights/scheduledQueryRules",
        // Microsoft Sentinel solution on a Log Analytics workspace
        "Microsoft.OperationsManagement/solutions",
    ];

    public static bool ShouldOmitResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        string normalized = resourceType.Trim();

        if (ExcludedProviderPrefixes.Any(prefix =>
                normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        if (ExcludedArmTypePrefixes.Any(prefix => MatchesTypePrefix(normalized, prefix)))
        {
            return true;
        }

        return normalized.Contains(AdvancedThreatProtectionSettingsSegment, StringComparison.OrdinalIgnoreCase);
    }

    public static bool ShouldOmit(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (ShouldOmitResourceType(ReadArmType(node)))
        {
            return true;
        }

        return IsCloudShellStorageAccount(node);
    }

    private static bool IsCloudShellStorageAccount(GraphNode node)
    {
        string armType = ReadArmType(node);

        if (!armType.StartsWith("Microsoft.Storage/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (node.Properties != null
            && node.Properties.TryGetValue("arm.resourceGroup", out string? resourceGroup)
            && resourceGroup.StartsWith(CloudShellStorageResourceGroupPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (node.Properties != null
            && node.Properties.TryGetValue("arm.id", out string? armId)
            && armId.Contains(
                "/resourceGroups/" + CloudShellStorageResourceGroupPrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static bool MatchesTypePrefix(string resourceType, string prefix)
    {
        return resourceType.Equals(prefix, StringComparison.OrdinalIgnoreCase)
            || resourceType.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties != null
            && node.Properties.TryGetValue("arm.type", out string? armType)
            && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return string.IsNullOrWhiteSpace(node.NodeType) ? string.Empty : node.NodeType;
    }
}
