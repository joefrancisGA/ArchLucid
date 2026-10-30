using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Shared JSON helpers for inbound ITSM vendor webhook payloads.</summary>
internal static class ItsmInboundJsonElementReader
{
    internal static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            value = default;

            return false;
        }

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
            return NormalizeWholeNumberStatusText(whole);

        if (element.TryGetDouble(out double numeric) && double.IsFinite(numeric))
            return TryNormalizeWholeNumberStatusText(numeric) ?? element.GetRawText();

        return element.GetRawText();
    }

    internal static string NormalizeStatusText(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int whole))
            return NormalizeWholeNumberStatusText(whole);

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric))
            return TryNormalizeWholeNumberStatusText(numeric) ?? trimmed;

        return trimmed;
    }

    private static string? TryNormalizeWholeNumberStatusText(double numeric)
    {
        double rounded = Math.Round(numeric);

        if (Math.Abs(numeric - rounded) < 0.0000001d)
            return NormalizeWholeNumberStatusText((long)rounded);

        return null;
    }

    private static string NormalizeWholeNumberStatusText(long whole) =>
        whole.ToString(CultureInfo.InvariantCulture);
}
