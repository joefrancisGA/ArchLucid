using System.Globalization;
using System.Text.Json;
namespace ArchLucid.Contracts.Serialization;

/// <summary>
///     Shared string-token parsing for contract enums that accept names or defined integer ordinals.
/// </summary>
internal static class DefinedEnumStringReader
{
    public static bool TryParse<TEnum>(string raw, out TEnum value) where TEnum : struct, Enum
    {
        value = default;

        if (!Enum.TryParse(raw, ignoreCase: true, out TEnum candidate))
            return false;

        if (!Enum.IsDefined(candidate))
            return false;

        value = candidate;
        return true;
    }

    public static void ThrowIfUndefinedNumericString<TEnum>(string raw, string unknownValueMessage) where TEnum : struct, Enum
    {

        if (!Enum.TryParse(raw, ignoreCase: true, out TEnum candidate))
            return;

        if (Enum.IsDefined(candidate))
            return;

        // Optional source-agent payloads serialize default enum ordinals as "0"; treat as absent, not out-of-range.
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericOrdinal)
            && numericOrdinal == 0)
        {
            return;
        }

        throw new JsonException(unknownValueMessage);
    }

    public static bool TryReadDefinedOrdinal<TEnum>(
        JsonElement element,
        out TEnum value,
        Func<int, JsonException> throwUnknownOrdinal) where TEnum : struct, Enum
    {
        value = default;

        if (element.ValueKind != JsonValueKind.Number)
            return false;

        if (element.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(TEnum), numeric))
                throw throwUnknownOrdinal(numeric);

            value = (TEnum)(object)numeric;
            return true;
        }

        if (element.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber <= int.MaxValue
            && wholeNumber == Math.Floor(wholeNumber))
        {
            int ordinal = (int)wholeNumber;

            if (!Enum.IsDefined(typeof(TEnum), ordinal))
                throw throwUnknownOrdinal(ordinal);

            value = (TEnum)(object)ordinal;
            return true;
        }

        return false;
    }

    public static TEnum ReadNumberTokenAsDefinedOrdinal<TEnum>(
        ref Utf8JsonReader reader,
        Func<int, JsonException> throwUnknownOrdinal,
        Func<JsonException> throwInvalidNumber) where TEnum : struct, Enum
    {

        if (reader.TryGetInt32(out int numeric))
        {

            if (!Enum.IsDefined(typeof(TEnum), numeric))
                throw throwUnknownOrdinal(numeric);

            return (TEnum)(object)numeric;
        }

        if (reader.TryGetDouble(out double wholeNumber)
            && double.IsFinite(wholeNumber)
            && wholeNumber >= 0
            && wholeNumber <= int.MaxValue
            && wholeNumber == Math.Floor(wholeNumber))
        {
            int ordinal = (int)wholeNumber;

            if (!Enum.IsDefined(typeof(TEnum), ordinal))
                throw throwUnknownOrdinal(ordinal);

            return (TEnum)(object)ordinal;
        }

        throw throwInvalidNumber();
    }
}
