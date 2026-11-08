using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Reads Azure Firewall network rules from <c>networkRuleCollections</c> on
///     <c>Microsoft.Network/azureFirewalls</c> (persisted by
///     <c>HostedAzureInventoryResourcePropertyExpander.AddAzureFirewallProperties</c>).
/// </summary>
public static class AzureInventoryAzureFirewallNetworkRuleParser
{
    public const string NetworkRuleCollectionsPropertyKey = "networkRuleCollections";

    public const string ApplicationRuleCollectionsPropertyKey = "applicationRuleCollections";

    public static bool HasNetworkRuleCollections(IReadOnlyDictionary<string, string> properties)
    {
        if (!properties.ContainsKey(NetworkRuleCollectionsPropertyKey)
            || string.IsNullOrWhiteSpace(properties[NetworkRuleCollectionsPropertyKey]))
        {
            return false;
        }

        return Parse(properties).Count > 0;
    }

    public static bool HasApplicationRuleCollections(IReadOnlyDictionary<string, string> properties)
    {
        if (!properties.ContainsKey(ApplicationRuleCollectionsPropertyKey)
            || string.IsNullOrWhiteSpace(properties[ApplicationRuleCollectionsPropertyKey]))
        {
            return false;
        }

        return JsonArrayHasElements(properties[ApplicationRuleCollectionsPropertyKey]);
    }

    public static IReadOnlyList<AzureInventoryAzureFirewallNetworkRule> Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!properties.TryGetValue(NetworkRuleCollectionsPropertyKey, out string? collectionsJson)
            || string.IsNullOrWhiteSpace(collectionsJson))
        {
            return [];
        }

        return ParseCollectionsJson(collectionsJson);
    }

    private static List<AzureInventoryAzureFirewallNetworkRule> ParseCollectionsJson(string collectionsJson)
    {
        List<AzureInventoryAzureFirewallNetworkRule> rules = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(collectionsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return rules;
            }

            foreach (JsonElement collectionElement in document.RootElement.EnumerateArray())
            {
                if (!TryResolvePropertiesElement(collectionElement, out JsonElement collectionProperties))
                {
                    continue;
                }

                string? collectionAction = TryReadActionType(collectionProperties);

                if (!collectionProperties.TryGetProperty("rules", out JsonElement rulesElement)
                    || rulesElement.ValueKind is not JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement ruleElement in rulesElement.EnumerateArray())
                {
                    if (!TryResolvePropertiesElement(ruleElement, out JsonElement ruleProperties))
                    {
                        continue;
                    }

                    AzureInventoryAzureFirewallNetworkRule? rule = TryParseRule(ruleProperties, collectionAction);

                    if (rule is not null)
                    {
                        rules.Add(rule);
                    }
                }
            }
        }
        catch (JsonException)
        {
            return [];
        }

        return rules;
    }

    private static AzureInventoryAzureFirewallNetworkRule? TryParseRule(
        JsonElement ruleProperties,
        string? collectionAction)
    {
        string? ruleAction = TryReadActionType(ruleProperties) ?? collectionAction;

        if (string.IsNullOrWhiteSpace(ruleAction))
        {
            return null;
        }

        int priority = TryReadInt(ruleProperties, "priority") ?? int.MaxValue;

        return new AzureInventoryAzureFirewallNetworkRule
        {
            Priority = priority,
            Action = ruleAction.Trim(),
            SourceAddresses = ReadStringList(ruleProperties, "sourceAddresses"),
            DestinationAddresses = ReadStringList(ruleProperties, "destinationAddresses"),
            DestinationPorts = ReadStringList(ruleProperties, "destinationPorts"),
            Protocols = ReadProtocols(ruleProperties),
        };
    }

    private static IReadOnlyList<string> ReadProtocols(JsonElement ruleProperties)
    {
        IReadOnlyList<string> protocols = ReadStringList(ruleProperties, "ipProtocols");

        if (protocols.Count > 0)
        {
            return protocols;
        }

        return ReadStringList(ruleProperties, "protocols");
    }

    private static IReadOnlyList<string> ReadStringList(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement values)
            || values.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<string> results = [];

        foreach (JsonElement value in values.EnumerateArray())
        {
            if (value.ValueKind is JsonValueKind.String)
            {
                string? text = value.GetString();

                if (!string.IsNullOrWhiteSpace(text))
                {
                    results.Add(text.Trim());
                }
            }
        }

        return results;
    }

    private static string? TryReadActionType(JsonElement propertiesElement)
    {
        if (!propertiesElement.TryGetProperty("action", out JsonElement actionElement))
        {
            return null;
        }

        if (actionElement.ValueKind is JsonValueKind.String)
        {
            return actionElement.GetString();
        }

        if (actionElement.ValueKind is JsonValueKind.Object
            && actionElement.TryGetProperty("type", out JsonElement typeElement)
            && typeElement.ValueKind is JsonValueKind.String)
        {
            return typeElement.GetString();
        }

        return null;
    }

    private static int? TryReadInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        if (value.ValueKind is JsonValueKind.Number && value.TryGetInt32(out int number))
        {
            return number;
        }

        return null;
    }

    private static bool TryResolvePropertiesElement(JsonElement element, out JsonElement propertiesElement)
    {
        if (element.ValueKind is JsonValueKind.Object
            && element.TryGetProperty("properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            propertiesElement = nested;

            return true;
        }

        if (element.ValueKind is JsonValueKind.Object)
        {
            propertiesElement = element;

            return true;
        }

        propertiesElement = default;

        return false;
    }

    private static bool JsonArrayHasElements(string collectionsJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(collectionsJson);

            return document.RootElement.ValueKind is JsonValueKind.Array
                   && document.RootElement.GetArrayLength() > 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
