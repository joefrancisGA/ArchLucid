using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads subnet associations for a route table from flattened properties (NR-02).
/// </summary>
public static class AzureInventoryRouteTableSubnetAssociationParser
{
    public static IReadOnlyList<string> Parse(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<string> subnetArmIds = [];

        foreach ((string key, string value) in properties)
        {
            if (!key.StartsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.RouteTableSubnetPrefix,
                    StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            string? normalized = NormalizeSubnetArmId(value);

            if (normalized is not null)
            {
                subnetArmIds.Add(normalized);
            }
        }

        return subnetArmIds;
    }

    private static string? NormalizeSubnetArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId)
            || !armId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(armId);
    }
}
