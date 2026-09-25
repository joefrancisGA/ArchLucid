using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads security rules from flattened <c>Microsoft.Network/networkSecurityGroups</c> properties (NR-02).
/// </summary>
public static class AzureInventoryNsgSecurityRuleParser
{
    public static IReadOnlyList<AzureInventoryNsgSecurityRule> Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<AzureInventoryNsgSecurityRule> explicitRules = ParseExplicitRuleProperties(properties);

        if (explicitRules.Count > 0)
        {
            return explicitRules;
        }

        if (!properties.TryGetValue("securityRules", out string? rulesJson)
            || string.IsNullOrWhiteSpace(rulesJson))
        {
            return [];
        }

        return ParseRulesJson(rulesJson);
    }

    private static List<AzureInventoryNsgSecurityRule> ParseExplicitRuleProperties(
        IReadOnlyDictionary<string, string> properties)
    {
        List<AzureInventoryNsgSecurityRule> rules = [];
        HashSet<string> indexes = [];

        foreach (string key in properties.Keys)
        {
            if (!key.StartsWith(InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix, StringComparison.OrdinalIgnoreCase)
                || !key.EndsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string index = key[
                InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix.Length..^InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix.Length];

            if (!indexes.Add(index))
            {
                continue;
            }

            rules.Add(new AzureInventoryNsgSecurityRule
            {
                RuleName = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleNameSuffix),
                Protocol = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix),
                SourcePortRange = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleSourcePortRangeSuffix),
                DestinationPortRange = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationPortRangeSuffix),
                Direction = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDirectionSuffix),
                Access = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleAccessSuffix),
                Priority = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrioritySuffix),
                SourceAddressPrefix = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleSourceAddressPrefixSuffix),
                DestinationAddressPrefix = ReadRuleProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationAddressPrefixSuffix),
            });
        }

        return rules;
    }

    private static List<AzureInventoryNsgSecurityRule> ParseRulesJson(string rulesJson)
    {
        List<AzureInventoryNsgSecurityRule> rules = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(rulesJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return rules;
            }

            foreach (JsonElement ruleElement in document.RootElement.EnumerateArray())
            {
                string? ruleName = TryReadString(ruleElement, "name");
                JsonElement propertiesElement = ruleElement;

                if (ruleElement.TryGetProperty("properties", out JsonElement nestedProperties)
                    && nestedProperties.ValueKind is JsonValueKind.Object)
                {
                    propertiesElement = nestedProperties;
                }

                rules.Add(new AzureInventoryNsgSecurityRule
                {
                    RuleName = ruleName,
                    Protocol = TryReadString(propertiesElement, "protocol"),
                    SourcePortRange = TryReadString(propertiesElement, "sourcePortRange"),
                    DestinationPortRange = TryReadString(propertiesElement, "destinationPortRange"),
                    Direction = TryReadString(propertiesElement, "direction"),
                    Access = TryReadString(propertiesElement, "access"),
                    Priority = TryReadString(propertiesElement, "priority"),
                    SourceAddressPrefix = TryReadString(propertiesElement, "sourceAddressPrefix"),
                    DestinationAddressPrefix = TryReadString(propertiesElement, "destinationAddressPrefix"),
                });
            }
        }
        catch (JsonException)
        {
            return rules;
        }

        return rules;
    }

    private static string? ReadRuleProperty(
        IReadOnlyDictionary<string, string> properties,
        string index,
        string suffix)
    {
        string key = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}{index}{suffix}";

        if (!properties.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? parsed = value.GetString();

        return string.IsNullOrWhiteSpace(parsed) ? null : parsed.Trim();
    }
}
