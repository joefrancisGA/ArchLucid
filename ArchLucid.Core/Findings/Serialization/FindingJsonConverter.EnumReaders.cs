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

        if (severityElement.ValueKind == JsonValueKind.Number && severityElement.TryGetInt32(out int numeric))
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

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numeric))
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

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
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

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString))
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
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingEnforcementTier), numeric))
                throw new JsonException($"Unknown finding enforcement tier value '{numeric}'.");

            return (FindingEnforcementTier)numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding enforcement tier.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding enforcement tier value is required.");

        return ReadEnforcementTierFromString(raw);
    }

    private static FindingTreatment? ReadTreatment(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingTreatment), numeric))
                throw new JsonException($"Unknown finding treatment value '{numeric}'.");

            return (FindingTreatment)numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding treatment.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding treatment value is required.");

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString))
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
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingClassification), numeric))
                throw new JsonException($"Unknown finding classification value '{numeric}'.");

            return (FindingClassification)numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding classification.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding classification value is required.");

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString))
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
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out int numeric))
        {
            if (!Enum.IsDefined(typeof(FindingHumanReviewStatus), numeric))
                throw new JsonException($"Unknown finding human review status value '{numeric}'.");

            return (FindingHumanReviewStatus)numeric;
        }

        if (element.ValueKind != JsonValueKind.String)
            throw new JsonException("Expected string or number for finding human review status.");

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Finding human review status value is required.");

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int numericFromString))
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
