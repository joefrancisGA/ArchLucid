using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter
{
    private static readonly string[] HumanReviewRegulatoryMarkers =
    [
        "regulation",
        "compliance",
        "pii",
        "personal data",
        "phi",
        "gdpr",
        "hipaa",
        "ccpa",
        "soc 2",
        "pci",
        "pci-dss",
        "iso 27001",
        "fedramp",
        "nist",
        "sox",
        "glba",
        "lgpd",
        "data protection",
    ];

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
        return ContainsAny(sourceText, HumanReviewRegulatoryMarkers);
    }

    private static bool LooksAmbiguous(string sourceText)
    {
        if (sourceText.Length > AmbiguousLengthThreshold)
        {
            return true;
        }

        return ContainsPhraseMarker(sourceText, "target state")
            || ContainsPhraseMarker(sourceText, "current state")
            || ContainsPhraseMarker(sourceText, "future state")
            || ContainsPhraseMarker(sourceText, "present state")
            || ContainsTokenMarker(sourceText, "to-be")
            || ContainsTokenMarker(sourceText, "as-is")
            || ContainsPhraseMarker(sourceText, "trust boundary")
            || ContainsPhraseMarker(sourceText, "contradict");
    }

    private static bool ContainsPhraseMarker(string sourceText, string marker) =>
        sourceText.Contains(marker, StringComparison.OrdinalIgnoreCase);

    private static bool ContainsTokenMarker(string sourceText, string marker)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(marker);

        ReadOnlySpan<char> text = sourceText.AsSpan();
        ReadOnlySpan<char> needle = marker.AsSpan();

        if (needle.Length > text.Length)
        {
            return false;
        }

        for (int index = 0; index <= text.Length - needle.Length; index++)
        {
            if (!text.Slice(index, needle.Length).Equals(needle, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            bool startOk = index == 0 || !char.IsLetterOrDigit(text[index - 1]);
            int end = index + needle.Length;
            bool endOk = end >= text.Length || !char.IsLetterOrDigit(text[end]);

            if (startOk && endOk)
            {
                return true;
            }
        }

        return false;
    }

    private static int FindTokenMarkerIndex(string sourceText, string marker, int startIndex)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(marker);

        ReadOnlySpan<char> text = sourceText.AsSpan();
        ReadOnlySpan<char> needle = marker.AsSpan();

        if (startIndex < 0 || startIndex > text.Length || needle.Length > text.Length - startIndex)
        {
            return -1;
        }

        for (int index = startIndex; index <= text.Length - needle.Length; index++)
        {
            if (!text.Slice(index, needle.Length).Equals(needle, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            bool startOk = index == 0 || !char.IsLetterOrDigit(text[index - 1]);
            int end = index + needle.Length;
            bool endOk = end >= text.Length || !char.IsLetterOrDigit(text[end]);

            if (startOk && endOk)
            {
                return index;
            }
        }

        return -1;
    }

    private static bool ContainsAny(string sourceText, params string[] needles)
    {
        return needles.Any(needle => sourceText.Contains(needle, StringComparison.OrdinalIgnoreCase));
    }
}
