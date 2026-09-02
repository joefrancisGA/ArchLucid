using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

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

        if (TryReadBooleanOrdinal(severityElement, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingSeverity), booleanOrdinal))
                throw new JsonException($"Unknown finding severity value '{booleanOrdinal}'.");

            return (FindingSeverity)booleanOrdinal;
        }

        if (severityElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding severity.");

        string? raw = severityElement.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingSeverity), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding severity value '{raw}'.");

            return (FindingSeverity)booleanOrdinalFromString;
        }

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

    private static FindingEnforcementTier ReadEnforcementTierFromString(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding enforcement tier value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");

            return (FindingEnforcementTier)booleanOrdinalFromString;
        }

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numeric)
            || TryParseWholeNumberString(raw, out numeric))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), numeric))
                throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");

            return (FindingEnforcementTier)numeric;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingEnforcementTier parsed))
            return parsed;

        throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");
    }

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

        if (TryReadBooleanOrdinal(element, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingConfidenceLevel), booleanOrdinal))
                throw new JsonException($"Unknown finding confidence level value '{booleanOrdinal}'.");

            return (FindingConfidenceLevel)booleanOrdinal;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding confidence level.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding confidence level value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingConfidenceLevel), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding confidence level value '{raw}'.");

            return (FindingConfidenceLevel)booleanOrdinalFromString;
        }

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

    private static FindingEnforcementTier ReadEnforcementTier(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(element, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), numeric))
                throw new JsonException($"Unknown finding enforcement tier value '{numeric}'.");

            return (FindingEnforcementTier)numeric;
        }

        if (TryReadBooleanOrdinal(element, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), booleanOrdinal))
                throw new JsonException($"Unknown finding enforcement tier value '{booleanOrdinal}'.");

            return (FindingEnforcementTier)booleanOrdinal;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding enforcement tier.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding enforcement tier value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding enforcement tier value '{raw}'.");

            return (FindingEnforcementTier)booleanOrdinalFromString;
        }

        return ReadEnforcementTierFromString(raw);
    }

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

    private static FindingClassification? ReadClassification(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberInt32(element, out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingClassification), numeric))
                throw new JsonException($"Unknown finding classification value '{numeric}'.");

            return (FindingClassification)numeric;
        }

        if (TryReadBooleanOrdinal(element, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(FindingClassification), booleanOrdinal))
                throw new JsonException($"Unknown finding classification value '{booleanOrdinal}'.");

            return (FindingClassification)booleanOrdinal;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding classification.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding classification value is required.");

        if (TryParseBooleanOrdinalString(raw, out int booleanOrdinalFromString))
        {
            if (!Enum.IsDefined(typeof(FindingClassification), booleanOrdinalFromString))
                throw new JsonException($"Unknown finding classification value '{raw}'.");

            return (FindingClassification)booleanOrdinalFromString;
        }

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString)
            || TryParseWholeNumberString(raw, out numericFromString))
        {
            if (!Enum.IsDefined(typeof(FindingClassification), numericFromString))
                throw new JsonException($"Unknown finding classification value '{raw}'.");

            return (FindingClassification)numericFromString;
        }

        if (Enum.TryParse(raw, ignoreCase: true, out FindingClassification parsed) && Enum.IsDefined(parsed))
            return parsed;

        throw new JsonException($"Unknown finding classification value '{raw}'.");
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
