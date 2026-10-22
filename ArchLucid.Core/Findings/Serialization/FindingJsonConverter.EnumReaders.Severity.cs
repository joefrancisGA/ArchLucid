using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    private static FindingSeverity ReadSeverity(JsonElement root, string propertyName)
    {
        if (!TryGetPropertyCaseInsensitive(root, propertyName, out JsonElement severityElement))
            return FindingSeverity.Info;

        if (severityElement.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(severityElement, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingSeverity), numeric))
                throw new JsonException($"Unknown finding severity value '{numeric}'.");

            return (FindingSeverity)numeric;
        }

        if (severityElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding severity.");

        string? raw = severityElement.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString)
            || TryParseWholeNumberString(raw, out numericFromString))
        {
            if (!Enum.IsDefined(typeof(FindingSeverity), numericFromString))
                throw new JsonException($"Unknown finding severity value '{raw}'.");

            return (FindingSeverity)numericFromString;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingSeverity parsed) && Enum.IsDefined(parsed))
            return parsed;

        return raw.Trim().ToLowerInvariant() switch
        {
            "low" => FindingSeverity.Info,
            "medium" => FindingSeverity.Warning,
            "high" => FindingSeverity.Error,
            _ => throw new JsonException($"Unknown finding severity value '{raw}'."),
        };
    }
}
