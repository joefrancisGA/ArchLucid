using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Normalizes diagnostic-setting companion rows into destination ARM ids (AX-DE-02).
/// </summary>
public static class AzureInventoryDiagnosticDestinationParser
{
    public static IEnumerable<string> EnumerateDestinationArmIds(JsonElement diagnostic)
    {
        string? workspaceId = TryReadJsonString(diagnostic, "workspaceId")
                              ?? TryReadJsonString(diagnostic, "workspaceResourceId");

        if (!string.IsNullOrWhiteSpace(workspaceId))
        {
            yield return ArmResourceIdNormalizer.Normalize(workspaceId);
        }

        string? storageAccountId = TryReadJsonString(diagnostic, "storageAccountId");

        if (!string.IsNullOrWhiteSpace(storageAccountId))
        {
            yield return ArmResourceIdNormalizer.Normalize(storageAccountId);
        }

        string? eventHubDestination = TryReadJsonString(diagnostic, "eventHubResourceId")
                                      ?? TryReadJsonString(diagnostic, "eventHubAuthorizationRuleId");

        if (!string.IsNullOrWhiteSpace(eventHubDestination))
        {
            string? normalizedEventHub = TryNormalizeEventHubDestination(eventHubDestination);

            if (!string.IsNullOrWhiteSpace(normalizedEventHub))
            {
                yield return normalizedEventHub;
            }
        }
    }

    public static bool HasAnyDestination(JsonElement diagnostic)
    {
        return EnumerateDestinationArmIds(diagnostic).Any();
    }

    private static string? TryNormalizeEventHubDestination(string eventHubDestination)
    {
        string normalized = ArmResourceIdNormalizer.Normalize(eventHubDestination.Trim());
        const string authorizationRulesSegment = "/authorizationRules/";

        int authorizationRulesIndex = normalized.IndexOf(authorizationRulesSegment, StringComparison.OrdinalIgnoreCase);

        if (authorizationRulesIndex > 0)
        {
            normalized = normalized[..authorizationRulesIndex];
        }

        if (normalized.Contains("/eventhubs/", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("/namespaces/", StringComparison.OrdinalIgnoreCase))
        {
            return normalized;
        }

        return null;
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
