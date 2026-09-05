using System.Text.Json;

namespace ArchLucid.Core.Persistence;

/// <summary>
///     Compares persisted run-header JSON anchors without treating property order or name casing as mutation.
/// </summary>
internal static class RunHeaderAnchorJsonComparer
{
    public static bool AreEquivalent(string? left, string? right)
    {
        if (string.Equals(left, right, StringComparison.Ordinal))
            return true;

        if (string.IsNullOrWhiteSpace(left) && string.IsNullOrWhiteSpace(right))
            return true;

        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        try
        {
            using JsonDocument leftDocument = JsonDocument.Parse(left);
            using JsonDocument rightDocument = JsonDocument.Parse(right);

            return ElementsEquivalent(leftDocument.RootElement, rightDocument.RootElement);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool ElementsEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind != right.ValueKind)
        {
            if (TryCrossKindEquivalent(left, right))
                return true;

            return false;
        }

        switch (left.ValueKind)
        {
            case JsonValueKind.Object:
                return ObjectsEquivalent(left, right);
            case JsonValueKind.Array:
                return ArraysEquivalent(left, right);
            case JsonValueKind.String:
                return StringsEquivalent(left, right);
            case JsonValueKind.Number:
                return NumbersEquivalent(left, right);
            case JsonValueKind.True:
            case JsonValueKind.False:
                return left.GetBoolean() == right.GetBoolean();
            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
                return true;
            default:
                return false;
        }
    }

    private static bool ObjectsEquivalent(JsonElement left, JsonElement right)
    {
        List<JsonProperty> leftProperties = left.EnumerateObject().ToList();
        List<JsonProperty> rightProperties = right.EnumerateObject().ToList();

        if (leftProperties.Count != rightProperties.Count)
            return false;

        foreach (JsonProperty leftProperty in leftProperties)
        {
            if (!TryGetPropertyCaseInsensitive(right, leftProperty.Name, out JsonElement rightValue))
                return false;

            if (!ElementsEquivalent(leftProperty.Value, rightValue))
                return false;
        }

        return true;
    }

    private static bool ArraysEquivalent(JsonElement left, JsonElement right)
    {
        List<JsonElement> leftItems = left.EnumerateArray().ToList();
        List<JsonElement> rightItems = right.EnumerateArray().ToList();

        if (leftItems.Count != rightItems.Count)
            return false;

        for (int index = 0; index < leftItems.Count; index++)
        {
            if (!ElementsEquivalent(leftItems[index], rightItems[index]))
                return false;
        }

        return true;
    }

    private static bool TryCrossKindEquivalent(JsonElement left, JsonElement right)
    {
        if (TryBooleanStringEquivalent(left, right))
            return true;

        if (TryNumberStringEquivalent(left, right))
            return true;

        return false;
    }

    private static bool TryBooleanStringEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.String && right.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return TryParseBooleanString(left, out bool leftBoolean) && leftBoolean == right.GetBoolean();

        if (right.ValueKind == JsonValueKind.String && left.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return TryParseBooleanString(right, out bool rightBoolean) && rightBoolean == left.GetBoolean();

        return false;
    }

    private static bool TryParseBooleanString(JsonElement element, out bool value)
    {
        value = false;

        string? text = element.GetString()?.Trim();

        if (text is null)
            return false;

        return bool.TryParse(text, out value);
    }

    private static bool TryNumberStringEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.String && right.ValueKind == JsonValueKind.Number)
            return TryParseDecimalString(left, out decimal leftNumber)
                && right.TryGetDecimal(out decimal rightNumber)
                && leftNumber == rightNumber;

        if (left.ValueKind == JsonValueKind.Number && right.ValueKind == JsonValueKind.String)
            return TryParseDecimalString(right, out decimal rightNumber)
                && left.TryGetDecimal(out decimal leftNumber)
                && leftNumber == rightNumber;

        return false;
    }

    private static bool TryParseDecimalString(JsonElement element, out decimal value)
    {
        value = default;

        string? text = element.GetString()?.Trim();

        if (text is null)
            return false;

        return decimal.TryParse(text, out value);
    }

    private static bool StringsEquivalent(JsonElement left, JsonElement right)
    {
        string? leftText = left.GetString();
        string? rightText = right.GetString();

        if (leftText is null || rightText is null)
            return leftText == rightText;

        return string.Equals(leftText.Trim(), rightText.Trim(), StringComparison.Ordinal);
    }

    private static bool NumbersEquivalent(JsonElement left, JsonElement right)
    {
        if (left.TryGetDecimal(out decimal leftNumber) && right.TryGetDecimal(out decimal rightNumber))
            return leftNumber == rightNumber;

        return false;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
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
}
