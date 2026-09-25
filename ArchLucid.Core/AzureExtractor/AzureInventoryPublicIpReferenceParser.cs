using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Extracts cited public IP ARM ids from parent resource properties (NR-03).</summary>
public static class AzureInventoryPublicIpReferenceParser
{
    public static IReadOnlyList<string> Parse(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        HashSet<string> publicIpArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string key, string value) in properties)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (IsPublicIpCarrierPropertyKey(key))
            {
                if (value.TrimStart().StartsWith("[", StringComparison.Ordinal))
                {
                    AddFromJsonArray(value, publicIpArmIds);
                }
                else if (value.StartsWith("/", StringComparison.Ordinal))
                {
                    publicIpArmIds.Add(ArmResourceIdNormalizer.Normalize(value));
                }
            }
        }

        return publicIpArmIds.OrderBy(id => id, StringComparer.Ordinal).ToList();
    }

    private static bool IsPublicIpCarrierPropertyKey(string key)
    {
        return key.Contains("publicIPAddress", StringComparison.OrdinalIgnoreCase)
            || key.Contains("publicIpAddresses", StringComparison.OrdinalIgnoreCase)
            || key.Equals("frontendIPConfigurations", StringComparison.OrdinalIgnoreCase)
            || key.Equals("ipConfigurations", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddFromJsonArray(string json, ISet<string> publicIpArmIds)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                string? armId = TryReadPublicIpArmId(element);

                if (!string.IsNullOrWhiteSpace(armId))
                {
                    publicIpArmIds.Add(ArmResourceIdNormalizer.Normalize(armId));
                }
            }
        }
        catch (JsonException)
        {
        }
    }

    private static string? TryReadPublicIpArmId(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.String)
        {
            string? direct = element.GetString();

            return direct?.StartsWith("/", StringComparison.Ordinal) == true ? direct : null;
        }

        if (element.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (element.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            string? id = idElement.GetString();

            if (id?.Contains("/publicIPAddresses/", StringComparison.OrdinalIgnoreCase) == true)
            {
                return id;
            }
        }

        if (element.TryGetProperty("properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object
            && properties.TryGetProperty("publicIPAddress", out JsonElement publicIpElement)
            && publicIpElement.ValueKind is JsonValueKind.Object
            && publicIpElement.TryGetProperty("id", out JsonElement nestedId)
            && nestedId.ValueKind is JsonValueKind.String)
        {
            return nestedId.GetString();
        }

        return null;
    }
}
