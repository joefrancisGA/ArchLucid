using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Companion inventory files are JSON arrays. PowerShell <c>ConvertTo-Json</c> unwraps a one-item
///     collection into a JSON object, so optional companions accept a single object as one row.
/// </summary>
public static class AzureExtractorJsonArrayRoot
{
    public static bool IsValidOptionalCompanionRoot(JsonElement root)
    {
        return root.ValueKind is JsonValueKind.Array or JsonValueKind.Object;
    }

    public static bool TryCloneRows(JsonElement root, out JsonElement[] rows)
    {
        if (root.ValueKind is JsonValueKind.Array)
        {
            rows = root.EnumerateArray().Select(static element => element.Clone()).ToArray();
            return true;
        }

        if (root.ValueKind is JsonValueKind.Object)
        {
            rows = [root.Clone()];
            return true;
        }

        rows = [];
        return false;
    }
}
