using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic orphan candidates from extractor <c>orphan-candidates.json</c> (TB-2213).</summary>
public static class ExtractorOrphanCandidatesClassifier
{
    private static readonly string[] CandidateArrayPropertyNames =
    [
        "candidates",
        "resources",
        "items",
        "orphans"
    ];

    /// <summary>Cost-optimization finding candidates from extractor <c>orphan-candidates.json</c>.</summary>
    public static IReadOnlyList<ExtractorOrphanCandidateFinding> ClassifyFromOrphanCandidatesJson(string orphanCandidatesJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(orphanCandidatesJson);

        using JsonDocument document = JsonDocument.Parse(orphanCandidatesJson);
        JsonElement root = document.RootElement;

        if (root.ValueKind is JsonValueKind.Array)
            return ClassifyArray(root);

        if (root.ValueKind is not JsonValueKind.Object)
            return [];

        foreach (string propertyName in CandidateArrayPropertyNames)
        {
            if (!root.TryGetProperty(propertyName, out JsonElement arrayElement))
                continue;

            if (arrayElement.ValueKind is not JsonValueKind.Array)
                continue;

            return ClassifyArray(arrayElement);
        }

        return [];
    }

    private static IReadOnlyList<ExtractorOrphanCandidateFinding> ClassifyArray(JsonElement arrayElement)
    {
        List<ExtractorOrphanCandidateFinding> findings = [];
        int index = 0;

        foreach (JsonElement row in arrayElement.EnumerateArray())
        {
            ExtractorOrphanCandidateFinding? finding = TryClassifyRow(row, index);

            if (finding is not null)
                findings.Add(finding);

            index++;
        }

        return findings;
    }

    private static ExtractorOrphanCandidateFinding? TryClassifyRow(JsonElement row, int entryIndex)
    {
        if (row.ValueKind is not JsonValueKind.Object)
            return null;

        string resourceId = ReadString(row, "resourceId", "id", "name");
        string resourceType = ReadString(row, "resourceType", "type");
        string reason = ReadString(row, "reason", "message", "description", "problem");

        if (string.IsNullOrWhiteSpace(resourceId))
            return null;

        if (string.IsNullOrWhiteSpace(resourceType))
            resourceType = "unknown";

        if (string.IsNullOrWhiteSpace(reason))
            reason = "Orphan or unattached resource candidate from extractor inventory.";

        decimal? annualSavingsUsd = TryReadAnnualSavingsUsd(row);

        return new ExtractorOrphanCandidateFinding(
            resourceId.Trim(),
            resourceType.Trim(),
            reason.Trim(),
            "CostOptimization",
            entryIndex,
            annualSavingsUsd);
    }

    private static string ReadString(JsonElement row, params string[] propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!row.TryGetProperty(propertyName, out JsonElement value))
                continue;

            string? text = value.GetString()?.Trim();

            if (!string.IsNullOrWhiteSpace(text))
                return text;
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

        foreach (string propertyName in new[] { "monthlySavingsUsd", "estimatedMonthlySavings", "monthlyCostUsd" })
        {
            if (!row.TryGetProperty(propertyName, out JsonElement value))
                continue;

            if (value.TryGetDecimal(out decimal monthly) && monthly > 0m)
                return monthly * 12m;
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

/// <summary>Extractor-grounded orphan candidate from <c>orphan-candidates.json</c>.</summary>
public sealed record ExtractorOrphanCandidateFinding(
    string ResourceId,
    string ResourceType,
    string Message,
    string Category,
    int EntryIndex,
    decimal? EstimatedAnnualSavingsUsd);
