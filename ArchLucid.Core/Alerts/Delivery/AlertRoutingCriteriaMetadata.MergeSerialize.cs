using System.Text.Json;

namespace ArchLucid.Core.Alerts.Delivery;

public static partial class AlertRoutingCriteriaMetadata
{
    private static Dictionary<string, JsonElement> ReadRootObject(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(metadataJson);
            Dictionary<string, JsonElement> root = new(StringComparer.Ordinal);

            if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (JsonProperty property in document.RootElement.EnumerateObject())
                {
                    root[property.Name] = property.Value.Clone();
                }
            }

            return root;
        }
        catch (JsonException)
        {
            return new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        }
    }

    private static IReadOnlyList<string> NormalizeList(IReadOnlyList<string> values)
    {
        return values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = null;

            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = "true";

            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("0", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("no", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("off", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = "false";

            return true;
        }

        value = null;

        return false;
    }
}
