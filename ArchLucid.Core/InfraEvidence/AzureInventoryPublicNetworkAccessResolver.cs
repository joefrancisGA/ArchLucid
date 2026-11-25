using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Interprets collected ARM properties for public network access (book Ch. 6–7, four-reality drift).
/// </summary>
public static class AzureInventoryPublicNetworkAccessResolver
{
    public static bool IsPublicNetworkAccessEnabled(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return false;
        }

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value))
            {
                continue;
            }

            if (entry.Key.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && entry.Value.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (entry.Key.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && IsPublicNetworkAccessValueEnabled(entry.Value))
            {
                return true;
            }
        }

        return false;
    }

    public enum ObservedPublicAccess
    {
        Unknown,
        Enabled,
        Disabled,
    }

    public enum PrivateEndpointApproval
    {
        Unknown,
        None,
        Approved,
        NotApproved,
    }

    public static ObservedPublicAccess ResolvePublicAccess(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null)
            return ObservedPublicAccess.Unknown;

        ObservedPublicAccess observed = ObservedPublicAccess.Unknown;
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!entry.Key.Equals("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && !entry.Key.Equals("properties.publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && !entry.Key.Equals("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && !entry.Key.Equals("properties.enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase))
                continue;

            string? value = entry.Value?.Trim();
            ObservedPublicAccess current = value?.ToUpperInvariant() switch
            {
                "ENABLED" or "TRUE" => ObservedPublicAccess.Enabled,
                "DISABLED" or "FALSE" => ObservedPublicAccess.Disabled,
                _ => ObservedPublicAccess.Unknown,
            };
            if (current == ObservedPublicAccess.Unknown
                || (observed != ObservedPublicAccess.Unknown && observed != current))
                return ObservedPublicAccess.Unknown;

            observed = current;
        }

        return observed;
    }

    public static bool HasPrivateEndpointConnectionEvidence(IReadOnlyDictionary<string, string>? properties) =>
        ResolvePrivateEndpointApproval(properties) is PrivateEndpointApproval.Approved or PrivateEndpointApproval.NotApproved;

    /// <summary>Approval evidence is not proof of private DNS resolution or working connectivity.</summary>
    public static PrivateEndpointApproval ResolvePrivateEndpointApproval(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null)
            return PrivateEndpointApproval.Unknown;

        PrivateEndpointApproval? observed = null;
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!entry.Key.Equals("privateEndpointConnections", StringComparison.OrdinalIgnoreCase)
                && !entry.Key.Equals("properties.privateEndpointConnections", StringComparison.OrdinalIgnoreCase))
                continue;

            PrivateEndpointApproval current = ParsePrivateEndpointApproval(entry.Value);
            if (current == PrivateEndpointApproval.Unknown || (observed.HasValue && observed.Value != current))
                return PrivateEndpointApproval.Unknown;

            observed = current;
        }

        return observed ?? PrivateEndpointApproval.Unknown;
    }

    private static PrivateEndpointApproval ParsePrivateEndpointApproval(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return PrivateEndpointApproval.Unknown;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
                return PrivateEndpointApproval.Unknown;

            bool approved = false;
            bool notApproved = false;
            Dictionary<string, string> statusesById = new(StringComparer.OrdinalIgnoreCase);
            foreach (JsonElement item in document.RootElement.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object
                    || !item.TryGetProperty("id", out JsonElement idElement)
                    || idElement.ValueKind != JsonValueKind.String
                    || string.IsNullOrWhiteSpace(idElement.GetString())
                    || !item.TryGetProperty("properties", out JsonElement connectionProperties)
                    || connectionProperties.ValueKind != JsonValueKind.Object
                    || !connectionProperties.TryGetProperty("privateLinkServiceConnectionState", out JsonElement state)
                    || state.ValueKind != JsonValueKind.Object
                    || !state.TryGetProperty("status", out JsonElement statusElement)
                    || statusElement.ValueKind != JsonValueKind.String)
                    return PrivateEndpointApproval.Unknown;

                string status = statusElement.GetString()?.Trim().ToUpperInvariant() ?? string.Empty;
                string id = idElement.GetString()!.Trim();
                if (statusesById.TryGetValue(id, out string? previous) && previous != status)
                    return PrivateEndpointApproval.Unknown;
                statusesById[id] = status;

                switch (status)
                {
                    case "APPROVED":
                        approved = true;
                        break;
                    case "PENDING":
                    case "REJECTED":
                    case "DISCONNECTED":
                        notApproved = true;
                        break;
                    default:
                        return PrivateEndpointApproval.Unknown;
                }
            }

            return approved ? PrivateEndpointApproval.Approved
                : notApproved ? PrivateEndpointApproval.NotApproved : PrivateEndpointApproval.None;
        }
        catch (JsonException)
        {
            return PrivateEndpointApproval.Unknown;
        }
    }

    public static bool IsPrivateEndpointOnlyExposure(IReadOnlyDictionary<string, string>? properties) =>
        ResolvePublicAccess(properties) == ObservedPublicAccess.Disabled
        && !IsPublicNetworkAccessEnabled(properties)
        && ResolvePrivateEndpointApproval(properties) == PrivateEndpointApproval.Approved;

    private static bool IsPublicNetworkAccessValueEnabled(string value)
    {
        string normalized = value.Trim();

        if (normalized.Equals("Disabled", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return normalized.Equals("Enabled", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("true", StringComparison.OrdinalIgnoreCase);
    }
}
