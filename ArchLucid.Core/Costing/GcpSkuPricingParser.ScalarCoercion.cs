using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    private static bool TryReadInt64Token(JsonElement element, out long value)
    {
        if (element.ValueKind == JsonValueKind.Number)
        {
            return element.TryGetInt64(out value)
                || JsonInt64TokenReader.TryParse(element.GetRawText(), out value);
        }

        if (element.ValueKind == JsonValueKind.String)
            return JsonInt64TokenReader.TryParse(element.GetString(), out value);

        value = default;
        return false;
    }

    private static bool TryReadInt32Token(JsonElement element, out int value)
    {
        if (TryReadInt64Token(element, out long wholeNumber) && wholeNumber is >= int.MinValue and <= int.MaxValue)
        {
            value = (int)wholeNumber;
            return true;
        }

        value = default;
        return false;
    }
}
