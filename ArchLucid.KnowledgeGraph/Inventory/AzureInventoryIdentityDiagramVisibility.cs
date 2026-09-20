using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Identity diagram compile retains identity-class ARM types that default inventory lists hide
///     (for example user-assigned managed identities). This helper surfaces what was hidden vs retained.
/// </summary>
public static class AzureInventoryIdentityDiagramVisibility
{
    public static IReadOnlyList<AzureInventoryIdentityDiagramSuppressedArmTypeSummary> ListInventoryFilteredIdentityArmTypes(
        IEnumerable<AzureInventoryResourceRecord> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        return resources
            .Where(resource => AzureInventoryTopologyCategory.IsIdentityArmResourceType(resource.ResourceType))
            .Where(resource => AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resource.ResourceType))
            .GroupBy(resource => resource.ResourceType!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new AzureInventoryIdentityDiagramSuppressedArmTypeSummary
            {
                ArmResourceType = group.Key,
                ResourceCount = group.Count(),
            })
            .OrderBy(summary => summary.ArmResourceType, StringComparer.Ordinal)
            .ToList();
    }
}

public sealed class AzureInventoryIdentityDiagramSuppressedArmTypeSummary
{
    public string ArmResourceType
    {
        get;
        init;
    } = string.Empty;

    public int ResourceCount
    {
        get;
        init;
    }
}
