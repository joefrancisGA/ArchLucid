using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     VNets using custom DNS resolvers (Ch. 7) — private reachability stays indeterminate without resolver answers.
/// </summary>
public sealed class AzureInventoryVnetCustomDnsIndex
{
    private const string AzureDefaultDnsServer = "168.63.129.16";

    private readonly HashSet<string> _vnetArmIdsWithCustomDns;

    private AzureInventoryVnetCustomDnsIndex(HashSet<string> vnetArmIdsWithCustomDns) =>
        _vnetArmIdsWithCustomDns = vnetArmIdsWithCustomDns;

    public bool VnetUsesCustomDns(string vnetArmId) =>
        _vnetArmIdsWithCustomDns.Contains(ArmResourceIdNormalizer.Normalize(vnetArmId));

    public static AzureInventoryVnetCustomDnsIndex Build(
        IEnumerable<AzureInventoryVnetCustomDnsResourceProperties> virtualNetworks)
    {
        ArgumentNullException.ThrowIfNull(virtualNetworks);

        HashSet<string> customDnsVnets = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryVnetCustomDnsResourceProperties vnet in virtualNetworks)
        {
            if (!vnet.ResourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (TryReadCustomDnsServers(vnet.Properties, out IReadOnlyList<string> dnsServers)
                && dnsServers.Any(server => !IsAzureDefaultDnsServer(server)))
            {
                customDnsVnets.Add(ArmResourceIdNormalizer.Normalize(vnet.AzureResourceId));
            }
        }

        return new AzureInventoryVnetCustomDnsIndex(customDnsVnets);
    }

    private static bool TryReadCustomDnsServers(
        IReadOnlyDictionary<string, string> properties,
        out IReadOnlyList<string> dnsServers)
    {
        dnsServers = [];

        if (properties.TryGetValue("dhcpOptions", out string? dhcpOptionsJson)
            && TryParseDnsServersFromJson(dhcpOptionsJson, out List<string> fromJson))
        {
            dnsServers = fromJson;

            return dnsServers.Count > 0;
        }

        if (properties.TryGetValue("dhcpOptions.dnsServers", out string? flatServers)
            && !string.IsNullOrWhiteSpace(flatServers))
        {
            dnsServers = flatServers
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

            return dnsServers.Count > 0;
        }

        return false;
    }

    private static bool TryParseDnsServersFromJson(string json, out List<string> dnsServers)
    {
        dnsServers = [];

        if (string.IsNullOrWhiteSpace(json))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (!document.RootElement.TryGetProperty("dnsServers", out JsonElement serversElement)
                || serversElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            foreach (JsonElement serverElement in serversElement.EnumerateArray())
            {
                if (serverElement.ValueKind == JsonValueKind.String)
                {
                    string? server = serverElement.GetString();

                    if (!string.IsNullOrWhiteSpace(server))
                    {
                        dnsServers.Add(server.Trim());
                    }
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return dnsServers.Count > 0;
    }

    private static bool IsAzureDefaultDnsServer(string server) =>
        string.Equals(server.Trim(), AzureDefaultDnsServer, StringComparison.OrdinalIgnoreCase);
}

public sealed class AzureInventoryVnetCustomDnsResourceProperties
{
    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ResourceType
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyDictionary<string, string> Properties
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
