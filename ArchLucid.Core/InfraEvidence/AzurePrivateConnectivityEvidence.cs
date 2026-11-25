using System.Net;
using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

public enum AzurePrivateConnectivityState
{
    Indeterminate,
    Blocked,
    ConfigurationSupported,
    Verified,
}

public enum AzurePrivateConnectivityCheck
{
    Unknown,
    Supported,
    Blocked,
}

/// <summary>Evidence for one source, endpoint, target, hostname and port tuple.
/// Measurements must be independently authenticated and scoped by the caller.</summary>
public static class AzurePrivateConnectivityEvidence
{
    public static AzurePrivateConnectivityState Evaluate(
        AzurePrivateConnectivityCheck approval,
        AzurePrivateConnectivityCheck dns,
        AzurePrivateConnectivityCheck forwarding,
        AzurePrivateConnectivityCheck routing,
        AzurePrivateConnectivityCheck security,
        bool matchingSuccessfulMeasurement = false)
    {
        AzurePrivateConnectivityCheck[] checks = [approval, dns, forwarding, routing, security];
        if (checks.Contains(AzurePrivateConnectivityCheck.Blocked))
            return matchingSuccessfulMeasurement ? AzurePrivateConnectivityState.Indeterminate : AzurePrivateConnectivityState.Blocked;
        if (checks.Any(check => check != AzurePrivateConnectivityCheck.Supported))
            return AzurePrivateConnectivityState.Indeterminate;
        return matchingSuccessfulMeasurement ? AzurePrivateConnectivityState.Verified : AzurePrivateConnectivityState.ConfigurationSupported;
    }

    public static AzurePrivateConnectivityCheck MatchDnsAddresses(
        IEnumerable<string>? expectedEndpointIps, IEnumerable<string>? observedAnswers)
    {
        if (expectedEndpointIps is null || observedAnswers is null)
            return AzurePrivateConnectivityCheck.Unknown;
        var expected = expectedEndpointIps.Select(ParseAddress).ToArray();
        var actual = observedAnswers.Select(ParseAddress).ToArray();
        if (expected.Length == 0 || actual.Length == 0 || expected.Any(ip => ip is null) || actual.Any(ip => ip is null))
            return AzurePrivateConnectivityCheck.Unknown;
        return actual.All(ip => expected.Contains(ip))
            ? AzurePrivateConnectivityCheck.Supported : AzurePrivateConnectivityCheck.Blocked;
    }

    private static IPAddress? ParseAddress(string value) =>
        IPAddress.TryParse(value, out IPAddress? ip) ? ip : null;

    /// <summary>Checks approval for the exact endpoint-target pair, not any connection on the target.</summary>
    public static AzurePrivateConnectivityCheck ResolveApproval(
        string targetArmId, IReadOnlyDictionary<string, string>? endpointProperties)
    {
        if (endpointProperties is null)
            return AzurePrivateConnectivityCheck.Unknown;
        HashSet<string> statuses = new(StringComparer.OrdinalIgnoreCase);
        foreach (string key in new[] { "privateLinkServiceConnections", "manualPrivateLinkServiceConnections" })
        {
            if (!endpointProperties.TryGetValue(key, out string? json))
                continue;
            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind != JsonValueKind.Array)
                    return AzurePrivateConnectivityCheck.Unknown;
                foreach (JsonElement item in doc.RootElement.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object || !item.TryGetProperty("properties", out JsonElement props)
                        || props.ValueKind != JsonValueKind.Object)
                        return AzurePrivateConnectivityCheck.Unknown;
                    if (!props.TryGetProperty("privateLinkServiceId", out JsonElement target)
                        || target.ValueKind != JsonValueKind.String)
                        return AzurePrivateConnectivityCheck.Unknown;
                    if (!string.Equals(ArmResourceIdNormalizer.Normalize(target.GetString()!), ArmResourceIdNormalizer.Normalize(targetArmId), StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!props.TryGetProperty("privateLinkServiceConnectionState", out JsonElement state)
                        || state.ValueKind != JsonValueKind.Object || !state.TryGetProperty("status", out JsonElement status)
                        || status.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(status.GetString()))
                        return AzurePrivateConnectivityCheck.Unknown;
                    statuses.Add(status.GetString()!.Trim());
                }
            }
            catch (JsonException)
            {
                return AzurePrivateConnectivityCheck.Unknown;
            }
        }
        if (statuses.Count != 1)
            return AzurePrivateConnectivityCheck.Unknown;
        string observed = statuses.Single().ToUpperInvariant();
        return observed switch
        {
            "APPROVED" => AzurePrivateConnectivityCheck.Supported,
            "PENDING" or "REJECTED" or "DISCONNECTED" => AzurePrivateConnectivityCheck.Blocked,
            _ => AzurePrivateConnectivityCheck.Unknown,
        };
    }
}
