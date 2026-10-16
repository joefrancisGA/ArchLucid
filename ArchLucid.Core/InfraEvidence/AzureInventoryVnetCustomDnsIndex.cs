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

            if (!TryReadCustomDnsServers(vnet.Properties, out IReadOnlyList<string> dnsServers)
                || !dnsServers.Any(server => !IsAzureDefaultDnsServer(server)))
            {
                continue;
            }

            string indexedVnetArmId = ResolveIndexedVnetArmId(vnet.AzureResourceId);

            if (string.IsNullOrWhiteSpace(indexedVnetArmId))
            {
                continue;
            }

            customDnsVnets.Add(indexedVnetArmId);
        }

        return new AzureInventoryVnetCustomDnsIndex(customDnsVnets);
    }

    private static bool TryReadCustomDnsServers(
        IReadOnlyDictionary<string, string> properties,
        out IReadOnlyList<string> dnsServers)
    {
        List<string> mergedServers = [];

        if (properties.TryGetValue("dhcpOptions", out string? dhcpOptionsJson)
            && TryParseDnsServersFromJson(dhcpOptionsJson, out List<string> fromJson))
        {
            mergedServers.AddRange(fromJson);
        }

        if (properties.TryGetValue("dhcpOptions.dnsServers", out string? flatServers)
            && !string.IsNullOrWhiteSpace(flatServers))
        {
            foreach (string server in flatServers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                mergedServers.Add(server);
            }
        }

        if (mergedServers.Count == 0)
        {
            dnsServers = [];

            return false;
        }

        dnsServers = mergedServers;

        return true;
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
            JsonElement root = document.RootElement;

            if (root.ValueKind is JsonValueKind.String)
            {
                string? nestedJson = root.GetString();

                if (string.IsNullOrWhiteSpace(nestedJson))
                {
                    return false;
                }

                return TryParseDnsServersFromJson(nestedJson, out dnsServers);
            }

            if (root.ValueKind is JsonValueKind.Array)
            {
                AppendDnsServersFromJsonArray(root, dnsServers);
            }
            else if (root.ValueKind is JsonValueKind.Object
                     && TryGetPropertyIgnoreCase(root, "dnsServers", out JsonElement serversElement))
            {
                if (serversElement.ValueKind is JsonValueKind.String)
                {
                    AppendDnsServersFromDelimitedString(serversElement.GetString(), dnsServers);
                }
                else if (serversElement.ValueKind is JsonValueKind.Array)
                {
                    AppendDnsServersFromJsonArray(serversElement, dnsServers);
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return dnsServers.Count > 0;
    }

    private static void AppendDnsServersFromJsonArray(JsonElement serversElement, List<string> dnsServers)
    {
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

    private static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {

            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }

    private static void AppendDnsServersFromDelimitedString(string? servers, List<string> dnsServers)
    {
        if (string.IsNullOrWhiteSpace(servers))
        {
            return;
        }

        foreach (string server in servers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            dnsServers.Add(server);
        }
    }

    private static bool IsAzureDefaultDnsServer(string server) =>
        string.Equals(server.Trim(), AzureDefaultDnsServer, StringComparison.OrdinalIgnoreCase);

    private static string ResolveIndexedVnetArmId(string azureResourceId)
    {
        string normalizedArmId = ArmResourceIdNormalizer.Normalize(azureResourceId);

        if (!normalizedArmId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
        {
            return normalizedArmId;
        }

        string? parentVnetArmId = AzureInventorySubnetArmIdHelper.TryResolveVnetArmIdFromSubnetArmId(normalizedArmId);

        if (string.IsNullOrWhiteSpace(parentVnetArmId))
        {
            return string.Empty;
        }

        return ArmResourceIdNormalizer.Normalize(parentVnetArmId);
    }
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
