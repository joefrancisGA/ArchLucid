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
        string key = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}{index}{suffix}";

        if (!properties.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
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
