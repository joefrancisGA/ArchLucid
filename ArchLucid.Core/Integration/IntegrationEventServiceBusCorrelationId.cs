using System.Diagnostics;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Core.Integration;

/// <summary>Resolves logical correlation ids for integration event Service Bus publish.</summary>
public static class IntegrationEventServiceBusCorrelationId
{
    /// <summary>Azure Service Bus correlation id max length.</summary>
    public const int MaxLength = 128;

    /// <summary>
    ///     Prefers <see cref="ActivityCorrelation.LogicalCorrelationIdTag" /> on the current activity chain;
    ///     otherwise reads camelCase <c>correlationId</c> from the JSON payload when present.
    /// </summary>
    public static string? TryResolveForPublish(ReadOnlyMemory<byte> payloadUtf8)
    {
        string? fromActivity = ActivityCorrelation.FindTagValueInChain(
            Activity.Current,
            ActivityCorrelation.LogicalCorrelationIdTag);

        if (!string.IsNullOrWhiteSpace(fromActivity))
            return Trim(fromActivity);

        return TryResolveFromPayload(payloadUtf8);
    }

    /// <summary>Truncates to <see cref="MaxLength" /> (Service Bus limit).</summary>
    public static string Trim(string correlationId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(correlationId);

        string trimmed = correlationId.Trim();

        return trimmed.Length <= MaxLength ? trimmed : trimmed[..MaxLength];
    }

    private static string? TryResolveFromPayload(ReadOnlyMemory<byte> payloadUtf8)
    {
        if (payloadUtf8.IsEmpty)
            return null;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(payloadUtf8);

            if (!TryGetCorrelationIdPropertyCaseInsensitive(doc.RootElement, out string? correlationId))
                return null;

            if (string.IsNullOrWhiteSpace(correlationId))
                return null;

            return Trim(correlationId);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool TryGetCorrelationIdPropertyCaseInsensitive(JsonElement root, out string? value)
    {
        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!string.Equals(property.Name, "correlationId", StringComparison.OrdinalIgnoreCase))
                continue;

            return TryReadCorrelationIdToken(property.Value, out value);
        }

        value = null;

        return false;
    }

    private static bool TryReadCorrelationIdToken(JsonElement element, out string? value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && TryParseWholeNumberString(raw.Trim(), out long numericFromString))
            {
                value = numericFromString.ToString(CultureInfo.InvariantCulture);

                return true;
            }

            if (TryNormalizeBooleanString(raw, out string? normalized))
            {
                value = normalized;

                return true;
            }

            value = raw;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numeric))
        {
            value = numeric.ToString(CultureInfo.InvariantCulture);

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber == Math.Floor(wholeNumber))
        {
            value = ((long)wholeNumber).ToString(CultureInfo.InvariantCulture);

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.GetRawText();

            return true;
        }

        value = null;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out long value)
    {
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
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
}
