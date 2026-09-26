using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts workflow actions whose inputs cite a resolvable ARM resource id (NR-01).
/// </summary>
public static class AzureInventoryWorkflowActionTargetParser
{
    private static readonly Regex ArmResourceIdRegex = new(
        @"/subscriptions/[^/""'\s]+/resource[Gg]roups/[^/""'\s]+/providers/[A-Za-z0-9.]+(?:/[^/""'\s]+)+",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static IReadOnlyList<AzureInventoryWorkflowActionTarget> Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<AzureInventoryWorkflowActionTarget> explicitTargets = ParseExplicitActionProperties(properties);

        if (explicitTargets.Count > 0)
        {
            return explicitTargets;
        }

        if (!properties.TryGetValue("definition", out string? definitionJson)
            || string.IsNullOrWhiteSpace(definitionJson))
        {
            return [];
        }

        return ParseDefinitionJson(definitionJson);
    }

    private static List<AzureInventoryWorkflowActionTarget> ParseExplicitActionProperties(
        IReadOnlyDictionary<string, string> properties)
    {
        List<AzureInventoryWorkflowActionTarget> targets = [];

        foreach ((string key, string value) in properties)
        {
            if (!key.StartsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix,
                    StringComparison.OrdinalIgnoreCase)
                || !key.EndsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix,
                    StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            string actionName = key[
                InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix.Length..^InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix.Length];

            if (string.IsNullOrWhiteSpace(actionName))
            {
                continue;
            }

            string? normalized = NormalizeArmId(value);

            if (normalized is null)
            {
                continue;
            }

            targets.Add(new AzureInventoryWorkflowActionTarget
            {
                ActionName = actionName.Trim(),
                TargetArmId = normalized,
            });
        }

        return targets;
    }

    private static List<AzureInventoryWorkflowActionTarget> ParseDefinitionJson(string definitionJson)
    {
        List<AzureInventoryWorkflowActionTarget> targets = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(definitionJson);
            JsonElement root = document.RootElement;

            if (root.ValueKind is JsonValueKind.Object
                && root.TryGetProperty("definition", out JsonElement nestedDefinition)
                && nestedDefinition.ValueKind is JsonValueKind.Object)
            {
                root = nestedDefinition;
            }

            if (!root.TryGetProperty("actions", out JsonElement actionsElement)
                || actionsElement.ValueKind is not JsonValueKind.Object)
            {
                return targets;
            }

            foreach (JsonProperty actionProperty in actionsElement.EnumerateObject())
            {
                string? targetArmId = TryReadActionTargetArmId(actionProperty.Value);

                if (string.IsNullOrWhiteSpace(targetArmId))
                {
                    continue;
                }

                targets.Add(new AzureInventoryWorkflowActionTarget
                {
                    ActionName = actionProperty.Name,
                    TargetArmId = targetArmId,
                });
            }
        }
        catch (JsonException)
        {
            return targets;
        }

        return targets;
    }

    private static string? TryReadActionTargetArmId(JsonElement actionElement)
    {
        if (actionElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (!actionElement.TryGetProperty("inputs", out JsonElement inputsElement))
        {
            return null;
        }

        foreach (string armId in EnumerateArmIds(inputsElement))
        {
            return armId;
        }

        return null;
    }

    private static IEnumerable<string> EnumerateArmIds(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
            {
                string? value = element.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                {
                    foreach (Match match in ArmResourceIdRegex.Matches(value))
                    {
                        string? normalized = NormalizeArmId(match.Value);

                        if (normalized is not null)
                        {
                            yield return normalized;
                        }
                    }
                }

                break;
            }

            case JsonValueKind.Object:
            {
                foreach (JsonProperty property in element.EnumerateObject())
                {
                    foreach (string armId in EnumerateArmIds(property.Value))
                    {
                        yield return armId;
                    }
                }

                break;
            }

            case JsonValueKind.Array:
            {
                foreach (JsonElement child in element.EnumerateArray())
                {
                    foreach (string armId in EnumerateArmIds(child))
                    {
                        yield return armId;
                    }
                }

                break;
            }
        }
    }

    private static string? NormalizeArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        if (!armId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(armId);
    }
}
