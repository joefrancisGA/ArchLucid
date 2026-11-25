using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Classifies delivery configuration only; never proves target authorization or delivery success.</summary>
public static class AzureInventoryEventGridDeliveryAuthentication
{
    public const string Unknown = "unknown";
    public const string SystemAssigned = "system-assigned";
    public const string UserAssigned = "user-assigned";
    public const string EntraWebhook = "entra-webhook";
    public const string DirectUnverified = "direct-unverified";

    public static string Normalize(string? value) => value switch
    {
        SystemAssigned => SystemAssigned,
        UserAssigned => UserAssigned,
        EntraWebhook => EntraWebhook,
        DirectUnverified => DirectUnverified,
        _ => Unknown,
    };

    public static string Resolve(JsonElement properties)
    {
        if (!AzureInventoryEventGridDestinationExtractor.TryResolveDestination(properties, out JsonElement destination))
            return Unknown;

        string? kind = AzureInventoryArmNestedObjectPropertyReader.TryReadString(destination, "endpointType");
        if (string.IsNullOrWhiteSpace(kind))
            return Unknown;

        if (properties.TryGetProperty("deliveryWithResourceIdentity", out JsonElement delivery)
            && delivery.ValueKind == JsonValueKind.Object)
        {
            if (!delivery.TryGetProperty("identity", out JsonElement identity)
                || identity.ValueKind != JsonValueKind.Object)
                return Unknown;

            string? type = ReadString(identity, "type");
            if (string.Equals(type, "SystemAssigned", StringComparison.OrdinalIgnoreCase))
                return SystemAssigned;

            if (string.Equals(type, "UserAssigned", StringComparison.OrdinalIgnoreCase)
                && ReadString(identity, "userAssignedIdentity") is string id
                && id.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
                && id.Contains("/providers/Microsoft.ManagedIdentity/userAssignedIdentities/", StringComparison.OrdinalIgnoreCase))
                return UserAssigned;

            return Unknown;
        }

        if (!kind.Equals("WebHook", StringComparison.OrdinalIgnoreCase))
            return DirectUnverified;

        JsonElement bag = AzureInventoryArmNestedObjectPropertyReader.ResolvePropertyBag(destination);
        string? tenant = ReadString(bag, "azureActiveDirectoryTenantId");
        string? audience = ReadString(bag, "azureActiveDirectoryApplicationIdOrUri");
        return Guid.TryParse(tenant, out Guid tenantId) && tenantId != Guid.Empty
            && !string.IsNullOrWhiteSpace(audience)
            ? EntraWebhook : DirectUnverified;
    }

    public static string? ReadUserAssignedIdentityResourceId(JsonElement properties)
    {
        if (Resolve(properties) != UserAssigned)
            return null;
        return ValidateIdentityResourceId(ReadString(properties.GetProperty("deliveryWithResourceIdentity").GetProperty("identity"), "userAssignedIdentity"));
    }

    public static string? ValidateIdentityResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 512 || value.Contains('?') || value.Contains('#'))
            return null;
        string[] parts = value.Trim().Split('/');
        return parts.Length == 9 && parts[0].Length == 0
            && parts[1].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)
            && parts[3].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase)
            && parts[5].Equals("providers", StringComparison.OrdinalIgnoreCase)
            && parts[6].Equals("Microsoft.ManagedIdentity", StringComparison.OrdinalIgnoreCase)
            && parts[7].Equals("userAssignedIdentities", StringComparison.OrdinalIgnoreCase)
            && parts.Skip(1).All(part => !string.IsNullOrWhiteSpace(part))
            ? value.Trim() : null;
    }

    private static string? ReadString(JsonElement element, string name) =>
        element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
}
