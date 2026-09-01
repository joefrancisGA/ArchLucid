using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter
{
    public ExtractionDifficulty Classify(string sourceText)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            return ExtractionDifficulty.ClearExtraction;
        }

        // Ambiguity / human-review signals must outrank superficial "structured" markers (tables, YAML
        // front matter, JSON braces). Otherwise contradictory content is stamped DirectlyEstablished.

        if (RequiresHumanReview(sourceText))
        {
            return ExtractionDifficulty.HumanReviewRequired;
        }

        if (LooksAmbiguous(sourceText))
        {
            return ExtractionDifficulty.AmbiguousExtraction;
        }

        if (LooksStructured(sourceText))
        {
            return ExtractionDifficulty.StructuredParse;
        }

        return ExtractionDifficulty.ClearExtraction;
    }

    private static bool LooksStructured(string sourceText)
    {
        string trimmed = sourceText.TrimStart();

        if (trimmed.StartsWith("{", StringComparison.Ordinal)
            || trimmed.StartsWith("[", StringComparison.Ordinal)
            || trimmed.StartsWith("---", StringComparison.Ordinal))
        {
            return true;
        }

        string[] lines = sourceText.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (lines.Length < 2)
        {
            return false;
        }

        int pipeLines = lines.Count(line => line.Contains('|', StringComparison.Ordinal));

        return pipeLines >= 2;
    }

    private static bool RequiresHumanReview(string sourceText)
    {
        bool mentionsSensitive = ContainsAny(
            sourceText,
            "regulation",
            "compliance",
            "pii",
            "gdpr",
            "hipaa");

        if (!mentionsSensitive)
        {
            return false;
        }

        bool lowClarity = sourceText.Length < 200
            || !sourceText.Contains(':', StringComparison.Ordinal);

        return lowClarity;
    }

    private static bool LooksAmbiguous(string sourceText)
    {
        if (sourceText.Length > AmbiguousLengthThreshold)
        {
            return true;
        }

        return ContainsAny(
            sourceText,
            "target state",
            "current state",
            "trust boundary",
            "contradict");
    }

    private static bool ContainsAny(string sourceText, params string[] needles)
    {
        return needles.Any(needle => sourceText.Contains(needle, StringComparison.OrdinalIgnoreCase));
    }
}
