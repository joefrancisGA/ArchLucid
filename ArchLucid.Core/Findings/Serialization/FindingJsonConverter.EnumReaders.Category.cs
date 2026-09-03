using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
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
}
