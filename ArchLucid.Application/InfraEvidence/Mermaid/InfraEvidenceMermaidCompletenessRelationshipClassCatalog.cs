using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Maps IE-RF-09 snapshot warning codes to relationship class labels and diagram modes (IDX-11).</summary>
public static class InfraEvidenceMermaidCompletenessRelationshipClassCatalog
{
    public static string? ResolveClassLabel(string warning)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(warning);

        string code = warning.Split(':', 2)[0];

        return code switch
        {
            AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing => "nicToSubnet",
            AzureInventoryRelationshipCompletenessWarningCodes.ArgVmNicMissing => "vmToNic",
            AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing => "peToTarget",
            AzureInventoryRelationshipCompletenessWarningCodes.ArgVnetPeeringMissing => "vnetPeering",
            AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing => "logicAppConnections",
            AzureInventoryRelationshipCompletenessWarningCodes.AdfLinkedServicesMissing => "adfLinkedServices",
            AzureInventoryRelationshipCompletenessWarningCodes.AdfPipelineFlowsMissing => "adfPipelineFlows",
            AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly => "appSettingHosts",
            _ => null,
        };
    }

    public static bool WarningAppliesToMode(string modeKey, string warning)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(warning);
        ArgumentException.ThrowIfNullOrWhiteSpace(modeKey);

        string code = warning.Split(':', 2)[0];
        string normalizedMode = modeKey.Trim();

        if (IsIdentityMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AdfLinkedServicesMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly;
        }

        if (IsDataFlowMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AdfLinkedServicesMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AdfPipelineFlowsMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly;
        }

        if (IsDataArchitectureMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.AdfLinkedServicesMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AdfPipelineFlowsMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing;
        }

        if (IsDataMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.AdfLinkedServicesMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly;
        }

        if (IsSecurityMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.EffectiveControlsCapped;
        }

        if (IsNetworkLikeMode(normalizedMode))
        {
            return code is AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.ArgVmNicMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.ArgVnetPeeringMissing
                or AzureInventoryRelationshipCompletenessWarningCodes.HostedNicListFailed;
        }

        return false;
    }

    private static bool IsNetworkLikeMode(string modeKey)
    {
        return string.Equals(modeKey, "network", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "full", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "executive", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "architecture", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "resourceGroup", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "selectedResources", StringComparison.OrdinalIgnoreCase)
               || string.Equals(modeKey, "dependencyNeighborhood", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsIdentityMode(string modeKey)
    {
        return string.Equals(modeKey, "identity", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataFlowMode(string modeKey)
    {
        return string.Equals(modeKey, "dataFlow", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataArchitectureMode(string modeKey)
    {
        return string.Equals(modeKey, "dataArchitecture", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataMode(string modeKey)
    {
        return string.Equals(modeKey, "data", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSecurityMode(string modeKey)
    {
        return string.Equals(modeKey, "security", StringComparison.OrdinalIgnoreCase);
    }
}
