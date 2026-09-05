using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Shared JSON helpers for inbound ITSM vendor webhook payloads.</summary>
internal static class ItsmInboundJsonElementReader
{
    internal static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }

    internal static string? ReadStringOrRawText(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
            return null;

        if (element.ValueKind == JsonValueKind.String)
            return element.GetString();

        if (element.ValueKind == JsonValueKind.Number)
            return ReadNumberAsStatusText(element);

        return element.GetRawText();
    }

    private static string ReadNumberAsStatusText(JsonElement element)
    {
        if (element.TryGetInt64(out long whole))
            return whole.ToString(CultureInfo.InvariantCulture);

        if (element.TryGetDouble(out double numeric) && double.IsFinite(numeric))
        {
            double rounded = Math.Round(numeric);

            if (Math.Abs(numeric - rounded) < 0.0000001d)
                return rounded.ToString(CultureInfo.InvariantCulture);
        }

        return element.GetRawText();
    }
}
