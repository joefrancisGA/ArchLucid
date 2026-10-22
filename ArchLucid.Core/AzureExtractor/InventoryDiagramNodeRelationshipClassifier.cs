namespace ArchLucid.Core.AzureExtractor;

/// <summary>Classifies inventory resources that render as relationships instead of nodes (NR-01, NR-02).</summary>
public static class InventoryDiagramNodeRelationshipClassifier
{
    public static bool TryClassify(string? armResourceType, out InventoryDiagramNodeRelationshipCategory category)
    {
        category = default;

        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (armResourceType.Equals("Microsoft.Network/connections", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Web/connections", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramNodeRelationshipCategory.Connection;
            return true;
        }

        if (armResourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramNodeRelationshipCategory.Workflow;
            return true;
        }

        if (armResourceType.Equals("Microsoft.Network/routeTables", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            category = InventoryDiagramNodeRelationshipCategory.Policy;
            return true;
        }

        return false;
    }

    public static bool IsConnectionArmType(string? armResourceType)
    {
        return TryClassify(armResourceType, out InventoryDiagramNodeRelationshipCategory category)
            && category == InventoryDiagramNodeRelationshipCategory.Connection;
    }

    public static bool IsWorkflowArmType(string? armResourceType)
    {
        return TryClassify(armResourceType, out InventoryDiagramNodeRelationshipCategory category)
            && category == InventoryDiagramNodeRelationshipCategory.Workflow;
    }

    public static bool IsPolicyArmType(string? armResourceType)
    {
        return TryClassify(armResourceType, out InventoryDiagramNodeRelationshipCategory category)
            && category == InventoryDiagramNodeRelationshipCategory.Policy;
    }
}
