using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    private static FindingConfidenceLevel? ReadConfidenceLevel(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Null)
            return null;

        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(element, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingConfidenceLevel), numeric))
                throw new JsonException($"Unknown finding confidence level value '{numeric}'.");

            return (FindingConfidenceLevel)numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding confidence level.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding confidence level value is required.");

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString)
            || TryParseWholeNumberString(raw, out numericFromString))
        {
            if (!Enum.IsDefined(typeof(FindingConfidenceLevel), numericFromString))
                throw new JsonException($"Unknown finding confidence level value '{raw}'.");

            return (FindingConfidenceLevel)numericFromString;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingConfidenceLevel parsed))
            return parsed;

        throw new JsonException($"Unknown finding confidence level value '{raw}'.");
    }
}
