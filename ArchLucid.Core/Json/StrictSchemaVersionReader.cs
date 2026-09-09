using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.Core.Json;

/// <summary>
///     Reads JSON <c>schemaVersion</c> values as whole-number schema ids only (no boolean or on/off synonyms).
/// </summary>
public static class StrictSchemaVersionReader
{
    public static bool TryReadSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberSchemaVersion(element, out schemaVersion))
        {
            return true;
        }

        if (element.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(element.GetString(), out schemaVersion))
        {
            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadSchemaVersion(JsonNode? versionNode, out int schemaVersion)
    {
        if (versionNode is null)
        {
            schemaVersion = default;

            return false;
        }

        if (versionNode.GetValueKind() == JsonValueKind.Number
            && TryReadWholeNumberSchemaVersion(versionNode, out schemaVersion))
        {
            return true;
        }

        if (versionNode.GetValueKind() == JsonValueKind.String
            && versionNode is JsonValue jsonValue
            && TryParseWholeNumberString(jsonValue.GetValue<string>(), out schemaVersion))
        {
            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadWholeNumberSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.TryGetInt32(out schemaVersion))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            schemaVersion = (int)numeric;

            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryReadWholeNumberSchemaVersion(JsonNode versionNode, out int schemaVersion)
    {
        if (versionNode is not JsonValue jsonValue)
        {
            schemaVersion = default;

            return false;
        }

        if (jsonValue.TryGetValue<int>(out schemaVersion))
        {
            return true;
        }

        if (jsonValue.TryGetValue<double>(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            schemaVersion = (int)numeric;

            return true;
        }

        schemaVersion = default;

        return false;
    }

    public static bool TryParseWholeNumberString(string? raw, out int value)
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
}
