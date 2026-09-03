using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    private static FindingTreatment? ReadTreatment(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(element, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingTreatment), numeric))
                throw new JsonException($"Unknown finding treatment value '{numeric}'.");

            return (FindingTreatment)numeric;
        }

        if (TryReadBooleanOrdinal(element, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingTreatment), booleanOrdinal))
                throw new JsonException($"Unknown finding treatment value '{booleanOrdinal}'.");

            return (FindingTreatment)booleanOrdinal;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding treatment.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding treatment value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingTreatment), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding treatment value '{raw}'.");

            return (FindingTreatment)booleanOrdinalFromString;
        }

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString)
            || TryParseWholeNumberString(raw, out numericFromString))
        {
            if (!Enum.IsDefined(typeof(FindingTreatment), numericFromString))
                throw new JsonException($"Unknown finding treatment value '{raw}'.");

            return (FindingTreatment)numericFromString;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingTreatment parsed) && Enum.IsDefined(parsed))
            return parsed;

        throw new JsonException($"Unknown finding treatment value '{raw}'.");
    }

    private static FindingHumanReviewStatus ReadHumanReviewStatus(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(element, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), numeric))
                throw new JsonException($"Unknown finding human review status value '{numeric}'.");

            return (FindingHumanReviewStatus)numeric;
        }

        if (TryReadBooleanOrdinal(element, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), booleanOrdinal))
                throw new JsonException($"Unknown finding human review status value '{booleanOrdinal}'.");

            return (FindingHumanReviewStatus)booleanOrdinal;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding human review status.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding human review status value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding human review status value '{raw}'.");

            return (FindingHumanReviewStatus)booleanOrdinalFromString;
        }

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString)
            || TryParseWholeNumberString(raw, out numericFromString))
        {
            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), numericFromString))
                throw new JsonException($"Unknown finding human review status value '{raw}'.");

            return (FindingHumanReviewStatus)numericFromString;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingHumanReviewStatus parsed) && Enum.IsDefined(parsed))
            return parsed;

        throw new JsonException($"Unknown finding human review status value '{raw}'.");
    }
}
