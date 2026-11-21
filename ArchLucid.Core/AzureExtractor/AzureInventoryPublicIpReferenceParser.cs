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
                string trimmed = value.TrimStart();

                if (trimmed.StartsWith("[", StringComparison.Ordinal))
                {
                    AddFromJsonArray(trimmed, publicIpArmIds);
                }
                else if (trimmed.StartsWith("{", StringComparison.Ordinal))
                {
                    AddFromJsonObject(trimmed, publicIpArmIds);
                }
                else if (trimmed.StartsWith("/", StringComparison.Ordinal) && IsPublicIpArmId(trimmed))
                {
                    publicIpArmIds.Add(ArmResourceIdNormalizer.Normalize(trimmed));
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

    private static void AddFromJsonObject(string json, ISet<string> publicIpArmIds)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            string? armId = TryReadPublicIpArmId(document.RootElement);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                publicIpArmIds.Add(ArmResourceIdNormalizer.Normalize(armId));
            }
        }
        catch (JsonException)
        {
        }
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
            string? direct = AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(element);

            return IsPublicIpArmId(direct) ? direct : null;
        }

        if (element.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? fromRoot = AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(element);

        if (IsPublicIpArmId(fromRoot))
        {
            return fromRoot;
        }

        string? fromNested = AzureInventoryArmNestedObjectPropertyReader.TryReadString(element, "publicIPAddress");

        if (IsPublicIpArmId(fromNested))
        {
            return fromNested;
        }

        return null;
    }

    private static bool IsPublicIpArmId(string? armId)
    {
        return !string.IsNullOrWhiteSpace(armId)
            && armId.Contains("/publicIPAddresses/", StringComparison.OrdinalIgnoreCase);
    }
}
