using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     VNets using custom DNS resolvers (Ch. 7) — private reachability stays indeterminate without resolver answers.
/// </summary>
public sealed class AzureInventoryVnetCustomDnsIndex
{
    private const string AzureDefaultDnsServer = "168.63.129.16";

    private const string FlattenedDnsServersIndexedKeyPrefix = "dhcpOptions.dnsServers.";

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

        if (TryGetFlattenedPropertyIgnoreCase(properties, "dhcpOptions", out string? dhcpOptionsJson)
            && TryParseDnsServersFromJson(dhcpOptionsJson!, out List<string> fromJson))
        {
            mergedServers.AddRange(fromJson);
        }

        if (TryGetFlattenedPropertyIgnoreCase(properties, "dhcpOptions.dnsServers", out string? flatServers)
            && !string.IsNullOrWhiteSpace(flatServers))
        {
            if (TryParseDnsServersFromJson(flatServers, out List<string> fromFlatJson))
            {
                mergedServers.AddRange(fromFlatJson);
            }
            else
            {
                foreach (string server in flatServers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    mergedServers.Add(ResolveFlattenedDnsServerValue(server));
                }
            }
        }

        AppendDnsServersFromIndexedFlattenedKeys(properties, mergedServers);

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

                if (TryParseDnsServersFromJson(nestedJson, out dnsServers))
                {
                    return true;
                }

                dnsServers.Add(ResolveFlattenedDnsServerValue(nestedJson));

                return dnsServers.Count > 0;
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
        if (TryAppendDnsServersFromNumericOctetArray(serversElement, dnsServers))
        {
            return;
        }

        foreach (JsonElement serverElement in serversElement.EnumerateArray())
        {

            if (serverElement.ValueKind == JsonValueKind.String)
            {
                string? server = serverElement.GetString();

                if (!string.IsNullOrWhiteSpace(server))
                {
                    dnsServers.Add(ResolveFlattenedDnsServerValue(server));
                }

                continue;
            }

            if (serverElement.ValueKind == JsonValueKind.Number
                && TryReadDnsServerFromNumericElement(serverElement, out string numericServer))
            {
                dnsServers.Add(ResolveFlattenedDnsServerValue(numericServer));
                continue;
            }

            if (serverElement.ValueKind == JsonValueKind.Object
                && TryReadDnsServerFromObjectElement(serverElement, out string objectServer))
            {
                dnsServers.Add(ResolveFlattenedDnsServerValue(objectServer));
            }
        }
    }

    private static bool TryReadDnsServerFromObjectElement(JsonElement serverElement, out string dnsServer)
    {
        string? resolved = AzureInventoryArmTolerantScalarReader.TryReadStringOrObjectScalar(serverElement);
        dnsServer = resolved ?? string.Empty;

        return !string.IsNullOrWhiteSpace(dnsServer);
    }

    private static bool TryAppendDnsServersFromNumericOctetArray(JsonElement serversElement, List<string> dnsServers)
    {

        if (serversElement.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        List<int> octets = [];

        foreach (JsonElement serverElement in serversElement.EnumerateArray())
        {

            if (serverElement.ValueKind is not JsonValueKind.Number
                || !TryReadByteOctet(serverElement, out int octet))
            {
                return false;
            }

            octets.Add(octet);
        }

        if (octets.Count == 0 || octets.Count % 4 != 0)
        {
            return false;
        }

        for (int offset = 0; offset < octets.Count; offset += 4)
        {
            dnsServers.Add(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "{0}.{1}.{2}.{3}",
                    octets[offset],
                    octets[offset + 1],
                    octets[offset + 2],
                    octets[offset + 3]));
        }

        return true;
    }

    private static bool TryReadDnsServerFromNumericElement(JsonElement serverElement, out string server)
    {
        server = string.Empty;

        if (serverElement.ValueKind is not JsonValueKind.Number)
        {
            return false;
        }

        if (TryReadByteOctet(serverElement, out int loneOctet))
        {
            return false;
        }

        if (!TryReadPackedUint32FromNumericElement(serverElement, out uint packedAddress))
        {
            string rawText = serverElement.GetRawText();

            if (TryFormatPackedUint32DnsAddressString(rawText, out string dottedFromRaw))
            {
                server = dottedFromRaw;

                return true;
            }

            server = rawText;

            return !string.IsNullOrWhiteSpace(server);
        }

        server = FormatPackedUint32DnsAddress(packedAddress);

        return true;
    }

    private static bool TryReadPackedUint32FromNumericElement(JsonElement serverElement, out uint packedAddress)
    {
        if (serverElement.TryGetUInt32(out packedAddress))
        {
            return true;
        }

        return TryParsePackedUint32DnsAddress(serverElement.GetRawText(), out packedAddress);
    }

    private static string FormatPackedUint32DnsAddress(uint packedAddress) =>
        string.Format(
            CultureInfo.InvariantCulture,
            "{0}.{1}.{2}.{3}",
            (packedAddress >> 24) & 0xFF,
            (packedAddress >> 16) & 0xFF,
            (packedAddress >> 8) & 0xFF,
            packedAddress & 0xFF);

    private static bool TryReadByteOctet(JsonElement serverElement, out int octet)
    {
        octet = 0;

        if (!serverElement.TryGetInt32(out int value) || value is < 0 or > 255)
        {
            return false;
        }

        octet = value;

        return true;
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

    private static bool TryGetFlattenedPropertyIgnoreCase(
        IReadOnlyDictionary<string, string> properties,
        string propertyName,
        out string? propertyValue)
    {
        if (properties.TryGetValue(propertyName, out propertyValue) && !string.IsNullOrWhiteSpace(propertyValue))
        {
            return true;
        }

        foreach ((string propertyKey, string value) in properties)
        {

            if (!propertyKey.Equals(propertyName, StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            propertyValue = value;

            return true;
        }

        propertyValue = null;

        return false;
    }

    private static void AppendDnsServersFromIndexedFlattenedKeys(
        IReadOnlyDictionary<string, string> properties,
        List<string> mergedServers)
    {
        foreach ((string propertyKey, string value) in properties)
        {

            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (!propertyKey.StartsWith(FlattenedDnsServersIndexedKeyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string indexSegment = propertyKey[FlattenedDnsServersIndexedKeyPrefix.Length..];

            if (string.IsNullOrWhiteSpace(indexSegment))
            {
                continue;
            }

            mergedServers.Add(ResolveFlattenedDnsServerValue(value));
        }
    }

    private static string ResolveFlattenedDnsServerValue(string value)
    {
        if (TryUnwrapJsonStringScalar(value, out string unwrapped))
        {
            value = unwrapped;
        }
        else
        {
            value = value.Trim();
        }

        if (TryFormatPackedUint32DnsAddressString(value, out string dottedAddress))
        {
            return dottedAddress;
        }

        return value;
    }

    private static bool TryParsePackedUint32DnsAddress(string value, out uint packedAddress)
    {
        if (uint.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out packedAddress))
        {
            return true;
        }

        ReadOnlySpan<char> hex = value.AsSpan().Trim();

        if (hex.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
        {
            hex = hex[2..];
        }

        if (uint.TryParse(hex, NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out packedAddress))
        {
            return true;
        }

        if (!double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out double numericValue)
            || numericValue < 256
            || numericValue > uint.MaxValue)
        {
            return false;
        }

        double rounded = Math.Round(numericValue);

        if (Math.Abs(numericValue - rounded) > 0.0001)
        {
            return false;
        }

        packedAddress = (uint)rounded;

        return true;
    }

    private static bool TryFormatPackedUint32DnsAddressString(string value, out string dottedAddress)
    {
        dottedAddress = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (value.Contains('.', StringComparison.Ordinal)
            && value.IndexOf('e', StringComparison.OrdinalIgnoreCase) < 0)
        {
            return false;
        }

        if (!TryParsePackedUint32DnsAddress(value, out uint packedAddress) || packedAddress <= 255)
        {
            return false;
        }

        dottedAddress = FormatPackedUint32DnsAddress(packedAddress);

        return true;
    }

    private static bool TryUnwrapJsonStringScalar(string value, out string unwrapped)
    {
        unwrapped = value.Trim();

        if (string.IsNullOrWhiteSpace(unwrapped))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(unwrapped);
            JsonElement root = document.RootElement;

            if (root.ValueKind is not JsonValueKind.String)
            {
                return false;
            }

            string? nested = root.GetString();

            if (string.IsNullOrWhiteSpace(nested))
            {
                return false;
            }

            unwrapped = nested.Trim();

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static void AppendDnsServersFromDelimitedString(string? servers, List<string> dnsServers)
    {
        if (string.IsNullOrWhiteSpace(servers))
        {
            return;
        }

        foreach (string server in servers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            dnsServers.Add(ResolveFlattenedDnsServerValue(server));
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
