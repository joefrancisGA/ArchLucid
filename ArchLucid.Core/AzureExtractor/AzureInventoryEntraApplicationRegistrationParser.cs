using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

public static class AzureInventoryEntraApplicationRegistrationParser
{
    public static bool TryParse(JsonElement element, out AzureInventoryEntraApplicationRegistrationRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Application registration row must be a JSON object.";
            return false;
        }

        string? appObjectId = TryReadString(element, "appObjectId");
        string? appId = TryReadString(element, "appId");
        string? servicePrincipalObjectId = TryReadString(element, "servicePrincipalObjectId");

        if (string.IsNullOrWhiteSpace(appObjectId)
            || string.IsNullOrWhiteSpace(appId)
            || string.IsNullOrWhiteSpace(servicePrincipalObjectId))
        {
            errorMessage = "appObjectId, appId, and servicePrincipalObjectId are required.";
            return false;
        }

        if (TryReadString(element, "appRoleId") is not null
            || TryReadString(element, "principalId") is not null)
        {
            errorMessage = "Application registration rows must not include app role assignment fields.";
            return false;
        }

        row = new AzureInventoryEntraApplicationRegistrationRow
        {
            AppObjectId = appObjectId.Trim(),
            AppId = appId.Trim(),
            ServicePrincipalObjectId = servicePrincipalObjectId.Trim(),
        };

        return true;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
