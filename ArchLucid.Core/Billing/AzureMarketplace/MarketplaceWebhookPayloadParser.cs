using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Core.Billing.AzureMarketplace;

/// <summary>
///     Extracts Marketplace SaaS webhook fields used for <c>ChangePlan</c> / <c>ChangeQuantity</c> (payload shape
///     varies slightly by action).
/// </summary>
public static class MarketplaceWebhookPayloadParser
{
    /// <summary>
    ///     Maps Azure Marketplace <c>planId</c> text to persisted <see cref="TenantTier" /> storage codes (
    ///     <c>Standard</c> vs <c>Enterprise</c>).
    /// </summary>
    public static string TierStorageCodeFromPlanId(string? planId)
    {
        if (string.IsNullOrWhiteSpace(planId))
            return nameof(TenantTier.Standard);

        string p = planId.Trim();

        // ReSharper disable once ConvertIfStatementToReturnStatement
        if (p.Contains("enterprise", StringComparison.OrdinalIgnoreCase))
            return nameof(TenantTier.Enterprise);

        return nameof(TenantTier.Standard);
    }

    /// <summary>Reads <c>planId</c> when present (string or number, coerced to invariant string).</summary>
    public static bool TryGetPlanId(JsonElement root, out string? planId)
    {
        planId = null;

        if (!TryGetStringPropertyCaseInsensitive(root, "planId", out string? s))
            return false;

        if (string.IsNullOrWhiteSpace(s))
            return false;

        planId = s.Trim();

        return true;
    }

    private static bool TryGetStringPropertyCaseInsensitive(JsonElement root, string propertyName, out string? value)
    {
        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (property.Value.ValueKind == JsonValueKind.Number)
            {
                value = TryReadWholeNumberLongToken(property.Value);

                return value is not null;
            }

            if (property.Value.ValueKind is JsonValueKind.True or JsonValueKind.False)
            {
                value = property.Value.GetRawText();

                return true;
            }

            if (property.Value.ValueKind != JsonValueKind.String)
            {
                value = null;

                return false;
            }

            string? raw = property.Value.GetString();

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                value = normalized;

                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberLongString(raw.Trim(), out long numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            value = raw;

            return true;
        }

        value = null;

        return false;
    }

    private static string? TryReadWholeNumberLongToken(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Number)
        {
            return null;
        }

        if (element.TryGetInt64(out long numeric))
        {
            return numeric.ToString(CultureInfo.InvariantCulture);
        }

        if (element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
        {
            return ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);
        }

        return element.GetRawText();
    }

    private static bool TryNormalizeBooleanString(string? raw, out string? value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = null;

            return false;
        }

        if (raw.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            value = "true";

            return true;
        }

        if (raw.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            value = "false";

            return true;
        }

        value = null;

        return false;
    }

    /// <summary>
    ///     Reads seat <c>quantity</c> from the webhook root (number or numeric string); defaults to
    ///     <paramref name="fallback" /> when absent.
    /// </summary>
    public static int ReadQuantity(JsonElement root, int fallback = 1)
    {
        if (!TryGetPropertyCaseInsensitive(root, "quantity", out JsonElement q))
            return Math.Max(1, fallback);

        if (q.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(q, out int wholeNumber))
            return Math.Max(1, wholeNumber);

        if (q.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return Math.Max(1, q.ValueKind == JsonValueKind.True ? 1 : 0);

        if (q.ValueKind != JsonValueKind.String)
            return Math.Max(1, fallback);

        string? s = q.GetString();

        if (TryParseBooleanString(s, out bool booleanQuantity))
            return Math.Max(1, booleanQuantity ? 1 : 0);

        if (TryParseWholeNumberString(s, out int parsed))
            return Math.Max(1, parsed);

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
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberLongString(string? raw, out long value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (long.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

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
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

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
