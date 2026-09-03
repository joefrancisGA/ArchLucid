using System.Text.Json;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    private static bool TryReadBooleanOrdinal(JsonElement element, out int ordinal)
    {
        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            ordinal = element.ValueKind == JsonValueKind.True ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanOrdinalString(string? raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }
}
