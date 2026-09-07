using System.Globalization;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Maps declared datastore SKU / replication properties to a redundancy tier (DX-25).</summary>
public static class DatastoreSkuReader
{
    private static readonly string[] SkuPropertyKeys =
    [
        "sku",
        "skuName",
        "replication",
        "accountReplicationType",
        "zoneRedundant",
        "geoRedundant",
        "locationCount",
    ];

    public static bool TryRead(
        IReadOnlyDictionary<string, string> properties,
        out DatastoreSkuTier tier,
        out string observedSku)
    {
        ArgumentNullException.ThrowIfNull(properties);

        tier = default;
        observedSku = string.Empty;

        if (!HasSkuEvidence(properties))
        {
            return false;
        }

        if (TryGetProperty(properties, "locationCount", out string? locationCountText)
            && int.TryParse(locationCountText, NumberStyles.Integer, CultureInfo.InvariantCulture, out int locationCount)
            && locationCount > 1)
        {
            tier = DatastoreSkuTier.MultiRegion;
            observedSku = $"locationCount={locationCount}";

            return true;
        }

        if (TryGetBooleanProperty(properties, "geoRedundant", out bool geoRedundant))
        {
            if (geoRedundant)
            {
                tier = DatastoreSkuTier.GeoRedundant;
                observedSku = "geoRedundant=true";

                return true;
            }

            tier = DatastoreSkuTier.SingleRegion;
            observedSku = "geoRedundant=false";

            return true;
        }

        if (TryGetBooleanProperty(properties, "zoneRedundant", out bool zoneRedundant))
        {
            if (zoneRedundant)
            {
                tier = DatastoreSkuTier.ZoneRedundant;
                observedSku = "zoneRedundant=true";

                return true;
            }

            tier = DatastoreSkuTier.SingleRegion;
            observedSku = "zoneRedundant=false";

            return true;
        }

        List<string> skuTokens = CollectSkuTokens(properties);

        if (skuTokens.Count == 0)
        {
            return false;
        }

        DatastoreSkuTier? mappedTier = TryMapSkuTokens(skuTokens, out string mappedSku);

        if (mappedTier is null)
        {
            return false;
        }

        tier = mappedTier.Value;
        observedSku = mappedSku;

        return true;
    }

    private static bool HasSkuEvidence(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in SkuPropertyKeys)
        {
            if (TryGetProperty(properties, key, out _))
            {
                return true;
            }
        }

        return false;
    }

    private static List<string> CollectSkuTokens(IReadOnlyDictionary<string, string> properties)
    {
        List<string> tokens = [];

        foreach (string key in new[] { "sku", "skuName", "replication", "accountReplicationType" })
        {
            if (TryGetProperty(properties, key, out string? value))
            {
                tokens.Add(value);
            }
        }

        return tokens;
    }

    private static DatastoreSkuTier? TryMapSkuTokens(IReadOnlyList<string> tokens, out string observedSku)
    {
        observedSku = tokens[0];

        foreach (string token in tokens)
        {
            string normalized = token.Trim();

            if (ContainsSkuToken(normalized, "RAGRS") || ContainsSkuToken(normalized, "GRS"))
            {
                observedSku = normalized;

                return DatastoreSkuTier.GeoRedundant;
            }

            if (ContainsSkuToken(normalized, "ZRS"))
            {
                observedSku = normalized;

                return DatastoreSkuTier.ZoneRedundant;
            }

            if (ContainsSkuToken(normalized, "LRS"))
            {
                observedSku = normalized;

                return DatastoreSkuTier.SingleRegion;
            }
        }

        return null;
    }

    private static bool ContainsSkuToken(string value, string token) =>
        value.Contains(token, StringComparison.OrdinalIgnoreCase);

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = string.Empty;

        return false;
    }

    private static bool TryGetBooleanProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out bool value)
    {
        if (!TryGetProperty(properties, key, out string? text))
        {
            value = false;

            return false;
        }

        if (bool.TryParse(text, out value))
        {
            return true;
        }

        if (string.Equals(text, "1", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (string.Equals(text, "0", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = false;

        return false;
    }
}
