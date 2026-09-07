using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Billing.AzureMarketplace;

/// <summary>
///     Reads seat <c>quantity</c> from Marketplace ChangeQuantity webhook payloads.
/// </summary>
public static class MarketplaceQuantityReader
{
    /// <summary>
    ///     Reads seat <c>quantity</c> when the webhook root includes a parseable <c>quantity</c> field.
    /// </summary>
    public static bool TryReadQuantity(JsonElement root, out int quantity)
    {
        quantity = 0;

        if (!TryGetPropertyCaseInsensitive(root, "quantity", out JsonElement q))
            return false;

        if (q.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(q, out int wholeNumber))
        {
            if (wholeNumber < 1)
                return false;

            quantity = wholeNumber;

            return true;
        }

        if (q.ValueKind != JsonValueKind.String)
            return false;

        string? s = q.GetString();

        if (TryParseWholeNumberString(s, out int parsed) && parsed >= 1)
        {
            quantity = parsed;

            return true;
        }

        return false;
    }

    /// <summary>
    ///     Reads seat <c>quantity</c> from the webhook root (number or numeric string); defaults to
    ///     <paramref name="fallback" /> when absent.
    /// </summary>
    public static int ReadQuantity(JsonElement root, int fallback = 1)
    {
        if (TryReadQuantity(root, out int quantity))
            return quantity;

        return Math.Max(1, fallback);
    }

    private static bool TryReadWholeNumberInt32(JsonElement element, out int value)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            value = default;

            return false;
        }

        if (element.TryGetInt32(out value))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement root, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
