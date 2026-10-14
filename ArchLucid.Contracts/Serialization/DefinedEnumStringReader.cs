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

        throw new JsonException(unknownValueMessage);
    }
}
