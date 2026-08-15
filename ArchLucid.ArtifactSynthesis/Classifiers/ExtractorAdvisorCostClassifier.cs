using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic Azure Advisor cost recommendations from extractor <c>advisor-cost.json</c> (TB-2213).</summary>
public static class ExtractorAdvisorCostClassifier
{
    private static readonly string[] RecommendationArrayPropertyNames =
    [
        "recommendations",
        "value",
        "items"
    ];

    /// <summary>Cost-optimization recommendations from extractor <c>advisor-cost.json</c>.</summary>
    public static IReadOnlyList<AdvisorCostRecommendationFinding> ClassifyFromAdvisorCostJson(string advisorCostJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(advisorCostJson);

        using JsonDocument document = JsonDocument.Parse(advisorCostJson);
        JsonElement root = document.RootElement;

        if (root.ValueKind is JsonValueKind.Array)
            return ClassifyArray(root);

        if (root.ValueKind is not JsonValueKind.Object)
            return [];

        foreach (string propertyName in RecommendationArrayPropertyNames)
        {
            if (!root.TryGetProperty(propertyName, out JsonElement arrayElement))
                continue;

            if (arrayElement.ValueKind is not JsonValueKind.Array)
                continue;

            return ClassifyArray(arrayElement);
        }

        return [];
    }

    private static IReadOnlyList<AdvisorCostRecommendationFinding> ClassifyArray(JsonElement arrayElement)
    {
        List<AdvisorCostRecommendationFinding> findings = [];
        int index = 0;

        foreach (JsonElement row in arrayElement.EnumerateArray())
        {
            AdvisorCostRecommendationFinding? finding = TryClassifyRow(row, index);

            if (finding is not null)
                findings.Add(finding);

            index++;
        }

        return findings;
    }

    private static AdvisorCostRecommendationFinding? TryClassifyRow(JsonElement row, int entryIndex)
    {
        if (row.ValueKind is not JsonValueKind.Object)
            return null;

        JsonElement properties = row.TryGetProperty("properties", out JsonElement nestedProperties)
                                 && nestedProperties.ValueKind is JsonValueKind.Object
            ? nestedProperties
            : row;

        string recommendationId = ReadString(row, "id", "name", "recommendationId");
        string category = ReadString(properties, "category", "impact");
        string title = ReadRecommendationTitle(properties);

        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(recommendationId))
            return null;

        if (string.IsNullOrWhiteSpace(title))
            title = "Azure Advisor cost recommendation";

        if (string.IsNullOrWhiteSpace(recommendationId))
            recommendationId = $"advisor-cost-entry-{entryIndex}";

        decimal? annualSavingsUsd = TryReadAnnualSavingsUsd(properties) ?? TryReadAnnualSavingsUsd(row);

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

        return ReadString(properties, "description", "title", "displayName", "problem", "solution");
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
                continue;

            if (value.TryGetDecimal(out decimal annual) && annual > 0m)
                return annual;
        }

        if (!row.TryGetProperty("potentialSavings", out JsonElement potentialSavings)
            || potentialSavings.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (potentialSavings.TryGetProperty("annualSavingsAmount", out JsonElement annualElement)
            && annualElement.TryGetDecimal(out decimal annualFromBlob)
            && annualFromBlob > 0m)
        {
            return annualFromBlob;
        }

        foreach (string propertyName in new[] { "estimatedMonthlySavings", "potentialMonthlySavings", "monthlySavings" })
        {
            if (!potentialSavings.TryGetProperty(propertyName, out JsonElement monthlyElement))
                continue;

            if (monthlyElement.TryGetDecimal(out decimal monthlyFromBlob) && monthlyFromBlob > 0m)
                return monthlyFromBlob * 12m;
        }

        return null;
    }
}

/// <summary>Extractor-grounded Azure Advisor cost recommendation from <c>advisor-cost.json</c>.</summary>
public sealed record AdvisorCostRecommendationFinding(
    string RecommendationId,
    string Title,
    string Category,
    int EntryIndex,
    decimal? EstimatedAnnualSavingsUsd);
