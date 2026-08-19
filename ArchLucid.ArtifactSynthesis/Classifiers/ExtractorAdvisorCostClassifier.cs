using System.Globalization;
using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic cost recommendations from extractor cost JSON (TB-2213 Azure; TB-2215 AWS/GCP).</summary>
public static class ExtractorAdvisorCostClassifier
{
    private const string AzureDefaultTitle = "Azure Advisor cost recommendation";
    private const string AzureDefaultIdPrefix = "advisor-cost-entry";

    private static readonly string[] RecommendationArrayPropertyNames =
    [
        "recommendations",
        "value",
        "items"
    ];

    /// <summary>Cost-optimization recommendations from extractor <c>advisor-cost.json</c>.</summary>
    public static IReadOnlyList<AdvisorCostRecommendationFinding> ClassifyFromAdvisorCostJson(string advisorCostJson)
    {
        return ClassifyFromAdvisorCostJson(advisorCostJson, AzureDefaultTitle, AzureDefaultIdPrefix);
    }

    /// <summary>Cost-optimization recommendations with cloud-specific default title and id prefix.</summary>
    public static IReadOnlyList<AdvisorCostRecommendationFinding> ClassifyFromAdvisorCostJson(
        string advisorCostJson,
        string defaultTitle,
        string defaultIdPrefix)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(advisorCostJson);
        ArgumentException.ThrowIfNullOrWhiteSpace(defaultTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(defaultIdPrefix);

        using JsonDocument document = JsonDocument.Parse(advisorCostJson);
        JsonElement root = document.RootElement;

        if (root.ValueKind is JsonValueKind.Array)
        {
            return ClassifyArray(root, defaultTitle, defaultIdPrefix);
        }

        if (root.ValueKind is not JsonValueKind.Object)
        {
            return [];
        }

        foreach (string propertyName in RecommendationArrayPropertyNames)
        {
            if (!root.TryGetProperty(propertyName, out JsonElement arrayElement))
            {
                continue;
            }

            if (arrayElement.ValueKind is not JsonValueKind.Array)
            {
                continue;
            }

            return ClassifyArray(arrayElement, defaultTitle, defaultIdPrefix);
        }

        return [];
    }

    private static IReadOnlyList<AdvisorCostRecommendationFinding> ClassifyArray(
        JsonElement arrayElement,
        string defaultTitle,
        string defaultIdPrefix)
    {
        List<AdvisorCostRecommendationFinding> findings = [];
        int index = 0;

        foreach (JsonElement row in arrayElement.EnumerateArray())
        {
            AdvisorCostRecommendationFinding? finding = TryClassifyRow(row, index, defaultTitle, defaultIdPrefix);

            if (finding is not null)
            {
                findings.Add(finding);
            }

            index++;
        }

        return findings;
    }

    private static AdvisorCostRecommendationFinding? TryClassifyRow(
        JsonElement row,
        int entryIndex,
        string defaultTitle,
        string defaultIdPrefix)
    {
        if (row.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        JsonElement properties = row.TryGetProperty("properties", out JsonElement nestedProperties)
                                 && nestedProperties.ValueKind is JsonValueKind.Object
            ? nestedProperties
            : row;

        string recommendationId = ReadString(row, "id", "name", "recommendationId");
        string category = ReadString(properties, "category", "impact", "finding");
        string title = ReadRecommendationTitle(properties);

        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(recommendationId))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            title = defaultTitle;
        }

        if (string.IsNullOrWhiteSpace(recommendationId))
        {
            recommendationId = $"{defaultIdPrefix}-{entryIndex}";
        }

        decimal? annualSavingsUsd = TryReadAnnualSavingsUsd(properties)
                                    ?? TryReadAnnualSavingsUsd(row)
                                    ?? TryReadCostProjectionAnnualSavingsUsd(properties)
                                    ?? TryReadCostProjectionAnnualSavingsUsd(row)
                                    ?? TryReadRecommendationOptionsAnnualSavingsUsd(properties)
                                    ?? TryReadRecommendationOptionsAnnualSavingsUsd(row);

        return new AdvisorCostRecommendationFinding(
            recommendationId.Trim(),
            title.Trim(),
            string.IsNullOrWhiteSpace(category) ? "Cost" : category.Trim(),
            entryIndex,
            annualSavingsUsd);
    }

    private static string ReadRecommendationTitle(JsonElement properties)
    {
        if (properties.TryGetProperty("shortDescription", out JsonElement shortDescription)
            && shortDescription.ValueKind is JsonValueKind.Object)
        {
            string problem = ReadString(shortDescription, "problem", "description");
            string solution = ReadString(shortDescription, "solution");

            if (!string.IsNullOrWhiteSpace(problem) && !string.IsNullOrWhiteSpace(solution))
                return $"{problem} — {solution}";

            if (!string.IsNullOrWhiteSpace(problem))
                return problem;

            if (!string.IsNullOrWhiteSpace(solution))
                return solution;
        }

        return ReadString(
            properties,
            "description",
            "title",
            "displayName",
            "problem",
            "solution",
            "finding",
            "recommenderSubtype");
    }

    private static string ReadString(JsonElement row, params string[] propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!row.TryGetProperty(propertyName, out JsonElement value))
                continue;

            if (value.ValueKind is JsonValueKind.String)
            {
                string? text = value.GetString()?.Trim();

                if (!string.IsNullOrWhiteSpace(text))
                    return text;
            }
        }

        return string.Empty;
    }

    private static decimal? TryReadAnnualSavingsUsd(JsonElement row)
    {
        foreach (string propertyName in new[] { "annualSavingsUsd", "annualSavingsAmount", "estimatedAnnualSavingsUsd" })
        {
            if (!row.TryGetProperty(propertyName, out JsonElement value))
            {
                continue;
            }

            if (TryReadPositiveDecimal(value, out decimal annual))
            {
                return annual;
            }
        }

        foreach (string propertyName in new[] { "estimatedMonthlySavings", "potentialMonthlySavings", "monthlySavings" })
        {
            if (!row.TryGetProperty(propertyName, out JsonElement monthlyElement))
            {
                continue;
            }

            if (TryReadPositiveDecimal(monthlyElement, out decimal monthlyFromRow))
            {
                return monthlyFromRow * 12m;
            }

            if (monthlyElement.ValueKind is JsonValueKind.Object
                && monthlyElement.TryGetProperty("value", out JsonElement nestedValue)
                && TryReadPositiveDecimal(nestedValue, out decimal monthlyFromValue))
            {
                return monthlyFromValue * 12m;
            }
        }

        if (!row.TryGetProperty("potentialSavings", out JsonElement potentialSavings)
            || potentialSavings.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (potentialSavings.TryGetProperty("annualSavingsAmount", out JsonElement annualElement)
            && TryReadPositiveDecimal(annualElement, out decimal annualFromBlob))
        {
            return annualFromBlob;
        }

        foreach (string propertyName in new[] { "estimatedMonthlySavings", "potentialMonthlySavings", "monthlySavings" })
        {
            if (!potentialSavings.TryGetProperty(propertyName, out JsonElement monthlyElement))
            {
                continue;
            }

            if (TryReadPositiveDecimal(monthlyElement, out decimal monthlyFromBlob))
            {
                return monthlyFromBlob * 12m;
            }
        }

        return null;
    }

    private static decimal? TryReadCostProjectionAnnualSavingsUsd(JsonElement row)
    {
        if (TryGetObjectProperty(row, "primaryImpact", out JsonElement primaryImpact)
            && TryGetObjectProperty(primaryImpact, "costProjection", out JsonElement nestedProjection))
        {
            return TryReadCostObjectAnnualSavingsUsd(nestedProjection);
        }

        if (TryGetObjectProperty(row, "costProjection", out JsonElement directProjection))
        {
            return TryReadCostObjectAnnualSavingsUsd(directProjection);
        }

        return null;
    }

    private static decimal? TryReadCostObjectAnnualSavingsUsd(JsonElement costProjection)
    {
        if (!TryGetObjectProperty(costProjection, "cost", out JsonElement cost))
        {
            return null;
        }

        if (!cost.TryGetProperty("units", out JsonElement units) || !TryReadPositiveDecimal(units, out decimal amount))
        {
            return null;
        }

        return amount * 12m;
    }

    private static decimal? TryReadRecommendationOptionsAnnualSavingsUsd(JsonElement row)
    {
        if (!row.TryGetProperty("recommendationOptions", out JsonElement options)
            || options.ValueKind is not JsonValueKind.Array)
        {
            return null;
        }

        foreach (JsonElement option in options.EnumerateArray())
        {
            decimal? savings = TryReadAnnualSavingsUsd(option);

            if (savings is not null)
            {
                return savings;
            }
        }

        return null;
    }

    private static bool TryGetObjectProperty(JsonElement row, string propertyName, out JsonElement value)
    {
        if (row.TryGetProperty(propertyName, out value) && value.ValueKind is JsonValueKind.Object)
        {
            return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadPositiveDecimal(JsonElement value, out decimal amount)
    {
        amount = 0m;

        if (value.ValueKind is JsonValueKind.Number && value.TryGetDecimal(out decimal numeric))
        {
            decimal absNumeric = Math.Abs(numeric);

            if (absNumeric > 0m)
            {
                amount = absNumeric;

                return true;
            }
        }

        if (value.ValueKind is JsonValueKind.String
            && decimal.TryParse(
                value.GetString(),
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out decimal parsed))
        {
            decimal absParsed = Math.Abs(parsed);

            if (absParsed > 0m)
            {
                amount = absParsed;

                return true;
            }
        }

        return false;
    }
}

/// <summary>Extractor-grounded Azure Advisor cost recommendation from <c>advisor-cost.json</c>.</summary>
public sealed record AdvisorCostRecommendationFinding(
    string RecommendationId,
    string Title,
    string Category,
    int EntryIndex,
    decimal? EstimatedAnnualSavingsUsd);
