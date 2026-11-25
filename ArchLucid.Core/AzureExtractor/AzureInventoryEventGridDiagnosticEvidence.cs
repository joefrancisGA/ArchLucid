using System.Text.Json;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Positive evidence of enabled diagnostic categories routed to a supported ARM destination.</summary>
public static class AzureInventoryEventGridDiagnosticEvidence
{
    public static bool IsApplicable(string type) =>
        type.Equals("Microsoft.EventGrid/topics", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Microsoft.EventGrid/domains", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Microsoft.EventGrid/systemTopics", StringComparison.OrdinalIgnoreCase);

    public static bool HasRoutedCategory(string resourceId, string category, IReadOnlyList<JsonElement> settings)
    {
        foreach (JsonElement setting in settings)
        {
            if (setting.ValueKind != JsonValueKind.Object
                || !setting.TryGetProperty("targetResourceId", out JsonElement target)
                || target.ValueKind != JsonValueKind.String
                || string.IsNullOrWhiteSpace(target.GetString())
                || !string.Equals(ArmResourceIdNormalizer.Normalize(target.GetString()!), ArmResourceIdNormalizer.Normalize(resourceId), StringComparison.OrdinalIgnoreCase))
                continue;

            var logs = AzureInventoryDiagnosticLogCategory.Read(setting);
            if (logs is null || !HasSupportedDestination(setting))
                continue;

            if (logs.Any(log => log.Enabled &&
                (string.Equals(log.Category, category, StringComparison.OrdinalIgnoreCase)
                || string.Equals(log.CategoryGroup, "allLogs", StringComparison.OrdinalIgnoreCase))))
                return true;
        }
        return false;
    }

    private static bool HasSupportedDestination(JsonElement setting)
    {
        return AzureInventoryDiagnosticDestinationParser.EnumerateDestinationArmIds(setting).Any(id =>
            id.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            && !id.Contains('?') && !id.Contains('#')
            && (id.Contains("/providers/Microsoft.OperationalInsights/workspaces/", StringComparison.OrdinalIgnoreCase)
                || id.Contains("/providers/Microsoft.Storage/storageAccounts/", StringComparison.OrdinalIgnoreCase)
                || id.Contains("/providers/Microsoft.EventHub/namespaces/", StringComparison.OrdinalIgnoreCase)));
    }
}
