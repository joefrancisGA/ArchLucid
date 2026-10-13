using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Reads the managed identity a resource runs as. A top-level <c>principalId</c> on the identity
///     document is the system-assigned identity. User-assigned identities are nested under
///     <c>userAssignedIdentities</c>.
/// </summary>
public static class AzureInventoryRuntimeIdentityReader
{
    public static bool HasRuntimeIdentity(IReadOnlyDictionary<string, string>? properties) =>
        TryReadSystemAssignedPrincipalId(properties, out _)
        || HasUserAssignedIdentity(properties);

    public static bool TryReadSystemAssignedPrincipalId(
        IReadOnlyDictionary<string, string>? properties,
        out string principalId)
    {
        principalId = string.Empty;

        if (properties is null || !properties.TryGetValue("identity", out string? identityJson))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(identityJson))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(identityJson);

            if (!document.RootElement.TryGetProperty("principalId", out JsonElement principal)
                || principal.ValueKind is not JsonValueKind.String)
            {
                return false;
            }

            string? value = principal.GetString();

            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            principalId = value.Trim();

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static bool HasUserAssignedIdentity(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return false;
        }

        if (properties.TryGetValue("identity", out string? identityJson)
            && TryReadUserAssignedIdentity(identityJson))
        {
            return true;
        }

        foreach (KeyValuePair<string, string> property in properties)
        {
            if (property.Key.Contains("userAssignedIdentities", StringComparison.OrdinalIgnoreCase)
                && property.Key.StartsWith("/", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryReadUserAssignedIdentity(string? identityJson)
    {
        if (string.IsNullOrWhiteSpace(identityJson))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(identityJson);

            return document.RootElement.TryGetProperty("userAssignedIdentities", out JsonElement assigned)
                && assigned.ValueKind is JsonValueKind.Object
                && assigned.EnumerateObject().Any(static property => !string.IsNullOrWhiteSpace(property.Name));
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
