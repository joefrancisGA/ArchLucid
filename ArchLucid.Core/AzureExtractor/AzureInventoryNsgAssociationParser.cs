using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads subnet and NIC associations for a network security group (NR-02).
/// </summary>
public static class AzureInventoryNsgAssociationParser
{
    public const string SubnetKind = "subnet";

    public const string NicKind = "nic";

    public static IReadOnlyList<AzureInventoryNsgAssociation> Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<AzureInventoryNsgAssociation> associations = [];
        HashSet<string> indexes = [];

        foreach (string key in properties.Keys)
        {
            if (!key.StartsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix,
                    StringComparison.OrdinalIgnoreCase)
                || !key.EndsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string index = key[
                InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix.Length..^InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix.Length];

            if (!indexes.Add(index))
            {
                continue;
            }

            string? targetArmId = ReadAssociationProperty(
                properties,
                index,
                InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix);

            if (string.IsNullOrWhiteSpace(targetArmId))
            {
                continue;
            }

            associations.Add(new AzureInventoryNsgAssociation
            {
                TargetArmId = ArmResourceIdNormalizer.Normalize(targetArmId),
                TargetKind = ReadAssociationProperty(
                    properties,
                    index,
                    InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix)
                    ?? InferTargetKind(targetArmId),
            });
        }

        return associations;
    }

    private static string? ReadAssociationProperty(
        IReadOnlyDictionary<string, string> properties,
        string index,
        string suffix)
    {
        string keyPrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}{index}";

        return ReadFlattenedPropertyValue(properties, keyPrefix, suffix);
    }

    private static string? ReadFlattenedPropertyValue(
        IReadOnlyDictionary<string, string> properties,
        string keyPrefix,
        string suffix)
    {
        string exactKey = $"{keyPrefix}{suffix}";

        if (properties.TryGetValue(exactKey, out string? exactValue) && !string.IsNullOrWhiteSpace(exactValue))
        {
            return exactValue.Trim();
        }

        foreach ((string propertyKey, string propertyValue) in properties)
        {
            if (propertyKey.StartsWith(keyPrefix, StringComparison.OrdinalIgnoreCase)
                && propertyKey.EndsWith(suffix, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(propertyValue))
            {
                return propertyValue.Trim();
            }
        }

        return null;
    }

    private static string InferTargetKind(string targetArmId)
    {
        if (targetArmId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
        {
            return SubnetKind;
        }

        if (targetArmId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase))
        {
            return NicKind;
        }

        return string.Empty;
    }
}
