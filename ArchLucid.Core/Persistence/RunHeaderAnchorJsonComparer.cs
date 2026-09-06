using System.Text.Json;

using ArchLucid.Core.Explanation;

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
        HashSet<string> propertyNames = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in left.EnumerateObject())
            propertyNames.Add(property.Name.Trim());

        foreach (JsonProperty property in right.EnumerateObject())
            propertyNames.Add(property.Name.Trim());

        foreach (string propertyName in propertyNames)
        {
            bool leftHasProperty = TryGetPropertyCaseInsensitive(left, propertyName, out JsonElement leftValue);
            bool rightHasProperty = TryGetPropertyCaseInsensitive(right, propertyName, out JsonElement rightValue);

            if (!PropertiesEquivalent(leftHasProperty, leftValue, rightHasProperty, rightValue))
                return false;
        }

        return true;
    }

    private static bool PropertiesEquivalent(
        bool leftHasProperty,
        JsonElement leftValue,
        bool rightHasProperty,
        JsonElement rightValue)
    {
        if (!leftHasProperty && !rightHasProperty)
            return true;

        if (IsNullOrAbsentProperty(leftHasProperty, leftValue) && IsNullOrAbsentProperty(rightHasProperty, rightValue))
            return true;

        if (!leftHasProperty)
            leftValue = default;

        if (!rightHasProperty)
            rightValue = default;

        return ElementsEquivalent(leftValue, rightValue);
    }

    private static bool IsNullOrAbsentProperty(bool hasProperty, JsonElement value)
    {
        return !hasProperty || value.ValueKind == JsonValueKind.Null;
    }

    private static bool ArraysEquivalent(JsonElement left, JsonElement right)
    {
        if (TryNestedEmptyArrayEquivalent(left, right))
            return true;

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

    private static bool TryNestedEmptyArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind != JsonValueKind.Array || right.ValueKind != JsonValueKind.Array)
            return false;

        return IsDeeplyNestedEmptyArray(left) && IsDeeplyNestedEmptyArray(right);
    }

    private static bool IsDeeplyNestedEmptyArray(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array)
            return false;

        if (element.GetArrayLength() == 0)
            return true;

        if (element.GetArrayLength() != 1)
            return false;

        return IsDeeplyNestedEmptyArray(element[0]);
    }

    private static bool TryCrossKindEquivalent(JsonElement left, JsonElement right)
    {
        if (TryBooleanStringEquivalent(left, right))
            return true;

        if (TryNumberStringEquivalent(left, right))
            return true;

        if (TryNullEmptyArrayEquivalent(left, right))
            return true;

        if (TryNullEmptyStringEquivalent(left, right))
            return true;

        if (TryNullEmptyObjectEquivalent(left, right))
            return true;

        if (TryScalarSingleElementArrayEquivalent(left, right))
            return true;

        if (TryNullSingleElementNullArrayEquivalent(left, right))
            return true;

        if (TryNumberBooleanEquivalent(left, right))
            return true;

        if (TryAbsentEmptyStringEquivalent(left, right))
            return true;

        if (TryAbsentEmptyObjectEquivalent(left, right))
            return true;

        if (TryAbsentEmptyArrayEquivalent(left, right))
            return true;

        if (TryObjectSingleElementArrayEquivalent(left, right))
            return true;

        return false;
    }

    private static bool TryObjectSingleElementArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Object && right.ValueKind == JsonValueKind.Array)
        {
            if (right.GetArrayLength() != 1)
                return false;

            return ElementsEquivalent(left, right[0]);
        }

        if (left.ValueKind == JsonValueKind.Array && right.ValueKind == JsonValueKind.Object)
        {
            if (left.GetArrayLength() != 1)
                return false;

            return ElementsEquivalent(left[0], right);
        }

        return false;
    }

    private static bool TryAbsentEmptyObjectEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Object && right.ValueKind == JsonValueKind.Undefined)
            return !left.EnumerateObject().Any();

        if (left.ValueKind == JsonValueKind.Undefined && right.ValueKind == JsonValueKind.Object)
            return !right.EnumerateObject().Any();

        return false;
    }

    private static bool TryAbsentEmptyArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Array && right.ValueKind == JsonValueKind.Undefined)
            return left.GetArrayLength() == 0 || IsDeeplyNestedEmptyArray(left);

        if (left.ValueKind == JsonValueKind.Undefined && right.ValueKind == JsonValueKind.Array)
            return right.GetArrayLength() == 0 || IsDeeplyNestedEmptyArray(right);

        return false;
    }

    private static bool TryAbsentEmptyStringEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.String && right.ValueKind == JsonValueKind.Undefined)
            return string.IsNullOrWhiteSpace(left.GetString());

        if (left.ValueKind == JsonValueKind.Undefined && right.ValueKind == JsonValueKind.String)
            return string.IsNullOrWhiteSpace(right.GetString());

        return false;
    }

    private static bool TryNumberBooleanEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Number && right.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return TryReadNumericBoolean(left, out bool leftBoolean) && leftBoolean == right.GetBoolean();

        if (right.ValueKind == JsonValueKind.Number && left.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return TryReadNumericBoolean(right, out bool rightBoolean) && rightBoolean == left.GetBoolean();

        return false;
    }

    private static bool TryReadNumericBoolean(JsonElement element, out bool value)
    {
        value = false;

        if (element.TryGetInt32(out int numeric))
        {
            value = numeric != 0;

            return true;
        }

        if (element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber == Math.Floor(wholeNumber))
        {
            value = wholeNumber != 0;

            return true;
        }

        return false;
    }

    private static bool TryNullSingleElementNullArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Null && right.ValueKind == JsonValueKind.Array)
            return IsDeeplyNestedNullScalar(right);

        if (left.ValueKind == JsonValueKind.Array && right.ValueKind == JsonValueKind.Null)
            return IsDeeplyNestedNullScalar(left);

        return false;
    }

    private static bool IsDeeplyNestedNullScalar(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
            return true;

        if (element.ValueKind != JsonValueKind.Array || element.GetArrayLength() != 1)
            return false;

        return IsDeeplyNestedNullScalar(element[0]);
    }

    private static bool TryScalarSingleElementArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (IsScalarJsonKind(left.ValueKind) && right.ValueKind == JsonValueKind.Array)
        {
            if (right.GetArrayLength() != 1)
                return false;

            return ElementsEquivalent(left, right[0]);
        }

        if (left.ValueKind == JsonValueKind.Array && IsScalarJsonKind(right.ValueKind))
        {
            if (left.GetArrayLength() != 1)
                return false;

            return ElementsEquivalent(left[0], right);
        }

        return false;
    }

    private static bool IsScalarJsonKind(JsonValueKind kind)
    {
        return kind is JsonValueKind.String
            or JsonValueKind.Number
            or JsonValueKind.True
            or JsonValueKind.False;
    }

    private static bool TryNullEmptyObjectEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Null && right.ValueKind == JsonValueKind.Object)
            return !right.EnumerateObject().Any();

        if (left.ValueKind == JsonValueKind.Object && right.ValueKind == JsonValueKind.Null)
            return !left.EnumerateObject().Any();

        return false;
    }

    private static bool TryNullEmptyArrayEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Null && right.ValueKind == JsonValueKind.Array)
            return right.GetArrayLength() == 0 || IsDeeplyNestedEmptyArray(right);

        if (left.ValueKind == JsonValueKind.Array && right.ValueKind == JsonValueKind.Null)
            return left.GetArrayLength() == 0 || IsDeeplyNestedEmptyArray(left);

        return false;
    }

    private static bool TryNullEmptyStringEquivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind == JsonValueKind.Null && right.ValueKind == JsonValueKind.String)
            return string.IsNullOrWhiteSpace(right.GetString());

        if (left.ValueKind == JsonValueKind.String && right.ValueKind == JsonValueKind.Null)
            return string.IsNullOrWhiteSpace(left.GetString());

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

        return RunExplanationAggregateJsonReader.TryParseBooleanString(text, out value);
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
            if (!string.Equals(property.Name.Trim(), propertyName.Trim(), StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
