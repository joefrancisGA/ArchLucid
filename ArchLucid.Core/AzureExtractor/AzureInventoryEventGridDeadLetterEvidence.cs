using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Sanitized dead-letter configuration, not evidence of delivery or effective access.</summary>
public sealed record AzureInventoryEventGridDeadLetterEvidence(string Status, string? ResourceId, string? Authentication, string? IdentityResourceId)
{
    public static AzureInventoryEventGridDeadLetterEvidence Extract(JsonElement properties)
    {
        if (properties.ValueKind != JsonValueKind.Object)
            return new("unknown", null, null, null);

        bool direct = properties.TryGetProperty("deadLetterDestination", out JsonElement destination)
            && destination.ValueKind != JsonValueKind.Null;
        bool wrapped = properties.TryGetProperty("deadLetterWithResourceIdentity", out JsonElement wrapper)
            && wrapper.ValueKind != JsonValueKind.Null;
        if (direct && wrapped)
            return new("unknown", null, null, null);
        if (!direct && !wrapped)
            return new("not-observed", null, null, null);

        string authentication = AzureInventoryEventGridDeliveryAuthentication.DirectUnverified;
        string? identityId = null;
        if (wrapped)
        {
            if (wrapper.ValueKind != JsonValueKind.Object
                || !wrapper.TryGetProperty("deadLetterDestination", out destination)
                || !wrapper.TryGetProperty("identity", out JsonElement identity)
                || identity.ValueKind != JsonValueKind.Object)
                return new("unknown", null, null, null);

            string? type = Read(identity, "type");
            identityId = AzureInventoryEventGridDeliveryAuthentication.ValidateIdentityResourceId(Read(identity, "userAssignedIdentity"));
            authentication = type?.ToUpperInvariant() switch
            {
                "SYSTEMASSIGNED" => AzureInventoryEventGridDeliveryAuthentication.SystemAssigned,
                "USERASSIGNED" when identityId is not null => AzureInventoryEventGridDeliveryAuthentication.UserAssigned,
                _ => AzureInventoryEventGridDeliveryAuthentication.Unknown,
            };
            if (authentication != AzureInventoryEventGridDeliveryAuthentication.UserAssigned)
                identityId = null;
        }

        if (destination.ValueKind != JsonValueKind.Object
            || !string.Equals(Read(destination, "endpointType"), "StorageBlob", StringComparison.OrdinalIgnoreCase))
            return new("unknown", null, authentication, identityId);

        JsonElement bag = AzureInventoryArmNestedObjectPropertyReader.ResolvePropertyBag(destination);
        string? account = Read(bag, "resourceId");
        string? container = Read(bag, "blobContainerName");
        string? resourceId = BuildContainerResourceId(account, container);
        return new(resourceId is null ? "unknown" : "configured", resourceId, authentication, identityId);
    }

    public static string? BuildContainerResourceId(string? account, string? container)
    {
        if (string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(container)
            || container.Length > 63 || container.Any(c => !(char.IsAsciiLetterOrDigit(c) || c == '-')))
            return null;
        return ValidateContainerResourceId(account.TrimEnd('/') + "/blobServices/default/containers/" + container);
    }

    public static string? ValidateContainerResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 512 || value.Contains('?') || value.Contains('#'))
            return null;
        string[] p = value.Split('/');
        return p.Length == 13 && p[0] == "" && p.Skip(1).All(x => !string.IsNullOrWhiteSpace(x))
            && p[1].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)
            && p[3].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase)
            && p[5].Equals("providers", StringComparison.OrdinalIgnoreCase)
            && p[6].Equals("Microsoft.Storage", StringComparison.OrdinalIgnoreCase)
            && p[7].Equals("storageAccounts", StringComparison.OrdinalIgnoreCase)
            && p[9].Equals("blobServices", StringComparison.OrdinalIgnoreCase)
            && p[10].Equals("default", StringComparison.OrdinalIgnoreCase)
            && p[11].Equals("containers", StringComparison.OrdinalIgnoreCase)
            && p[12].All(c => char.IsAsciiLetterOrDigit(c) || c == '-')
            ? value : null;
    }

    private static string? Read(JsonElement element, string name) =>
        element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
}
