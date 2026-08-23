using System.Text.RegularExpressions;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter : IDifficultyBasedExtractionRouter
{
    private const int AmbiguousLengthThreshold = 8000;

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

    public IReadOnlyList<ArchitectureModelElement> Extract(string sourceText, string artifactId)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            return [];
        }

        if (string.IsNullOrWhiteSpace(artifactId))
        {
            throw new ArgumentException("ArtifactId is required.", nameof(artifactId));
        }

        ExtractionDifficulty difficulty = Classify(sourceText);
        (SupportStatus supportStatus, double confidence) = MapDifficultyToProvenance(difficulty);
        List<ArchitectureModelElement> elements = [];

        foreach (Match match in ComponentLinePattern().Matches(sourceText))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Component,
                match.Groups["name"].Value.Trim(),
                artifactId,
                supportStatus,
                confidence,
                "Component mention extracted from source text.",
                InferLifecycleScopeForIndex(sourceText, match.Index)));
        }

        foreach (Match match in RequirementLinePattern().Matches(sourceText))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.FunctionalRequirement,
                match.Groups["name"].Value.Trim(),
                artifactId,
                supportStatus,
                confidence,
                "Functional requirement extracted from source text.",
                InferLifecycleScopeForIndex(sourceText, match.Index)));
        }

        if (sourceText.Contains("RTO", StringComparison.OrdinalIgnoreCase)
            || sourceText.Contains("RPO", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.RecoveryObjective,
                "Recovery objective",
                artifactId,
                supportStatus,
                confidence,
                "Recovery objective signal detected."));
        }

        int? backupIntervalMinutes = SpecialistReviewModelAdequacy.TryParseBackupIntervalMinutes(sourceText);

        if (backupIntervalMinutes is not null)
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Constraint,
                $"Documented backup interval: {backupIntervalMinutes} minutes",
                artifactId,
                supportStatus,
                confidence,
                "Backup interval extracted from source text."));
        }

        decimal? monthlyCeilingUsd = SpecialistReviewModelAdequacy.TryParseMonthlyCostCeilingUsd(sourceText);

        if (monthlyCeilingUsd is not null)
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Constraint,
                $"Monthly cost ceiling: ${monthlyCeilingUsd:0}",
                artifactId,
                supportStatus,
                confidence,
                "Monthly cost ceiling extracted from source text."));
        }

        if (sourceText.Contains("cost driver", StringComparison.OrdinalIgnoreCase)
            || sourceText.Contains("primary cost", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.CostDriver,
                "Primary cost drivers",
                artifactId,
                supportStatus,
                confidence,
                "Cost driver signal detected."));
        }

        if (sourceText.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.TrustBoundary,
                "Trust boundary",
                artifactId,
                supportStatus,
                confidence,
                "Trust boundary mention detected."));
        }

        if (sourceText.Contains("public endpoint", StringComparison.OrdinalIgnoreCase)
            || sourceText.Contains("public api", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Interface,
                "Public endpoint",
                artifactId,
                supportStatus,
                confidence,
                "Public endpoint mention detected."));
        }

        if (sourceText.Contains("owner", StringComparison.OrdinalIgnoreCase)
            && sourceText.Contains("unowned", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.OperationalOwnership,
                "Unowned component",
                artifactId,
                supportStatus,
                confidence,
                "Operational ownership gap detected."));
        }

        if (sourceText.Contains("current state", StringComparison.OrdinalIgnoreCase)
            && sourceText.Contains("target state", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Assumption,
                "Current vs target state",
                artifactId,
                supportStatus,
                confidence,
                "Current and target state markers detected.",
                ArchitectureLifecycleScope.Transition));
        }

        if (sourceText.Contains("contradict", StringComparison.OrdinalIgnoreCase))
        {
            (string name, string notes) = ArchitectureContradictionClassifier.Classify(sourceText);
            elements.Add(CreateElement(
                ArchitectureElementKind.Contradiction,
                name,
                artifactId,
                supportStatus,
                confidence,
                notes));
        }

        if (sourceText.Contains("backup", StringComparison.OrdinalIgnoreCase)
            && elements.All(element =>
                !element.Name.Contains("backup", StringComparison.OrdinalIgnoreCase)))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Constraint,
                "Database backup schedule",
                artifactId,
                supportStatus,
                confidence,
                "Backup schedule mention detected."));
        }

        if (sourceText.Contains("trade-off", StringComparison.OrdinalIgnoreCase)
            || sourceText.Contains("trade off", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.TradeOff,
                "Approved trade-off",
                artifactId,
                supportStatus,
                confidence,
                "Trade-off marker detected."));
        }

        if (sourceText.Contains("single-region", StringComparison.OrdinalIgnoreCase))
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Decision,
                "Single-region deployment",
                artifactId,
                supportStatus,
                confidence,
                "Single-region deployment decision detected."));
        }

        if (elements.Count == 0)
        {
            elements.Add(CreateElement(
                ArchitectureElementKind.Assumption,
                "Unclassified architecture content",
                artifactId,
                SupportStatus.NotYetEvaluated,
                Math.Min(confidence, 0.4),
                "No structured architecture elements were confidently extracted."));
        }

        return elements;
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

    private static (SupportStatus SupportStatus, double Confidence) MapDifficultyToProvenance(ExtractionDifficulty difficulty)
    {
        return difficulty switch
        {
            ExtractionDifficulty.StructuredParse => (SupportStatus.DirectlyEstablished, 0.9),
            ExtractionDifficulty.ClearExtraction => (SupportStatus.DirectlyEstablished, 0.8),
            ExtractionDifficulty.AmbiguousExtraction => (SupportStatus.IndirectlySupported, 0.55),
            ExtractionDifficulty.HumanReviewRequired => (SupportStatus.NotYetEvaluated, 0.35),
            _ => (SupportStatus.NotYetEvaluated, 0.4),
        };
    }

    private static ArchitectureModelElement CreateElement(
        ArchitectureElementKind kind,
        string name,
        string artifactId,
        SupportStatus supportStatus,
        double confidence,
        string notes,
        ArchitectureLifecycleScope lifecycleScope = ArchitectureLifecycleScope.Unspecified)
    {
        return new ArchitectureModelElement
        {
            ElementId = Guid.NewGuid().ToString("N"),
            Kind = kind,
            Name = name,
            ExtractionConfidence = confidence,
            LifecycleScope = lifecycleScope,
            SourcePassageIds = [artifactId],
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.DirectlyExtracted,
                SupportStatus = supportStatus,
                Confidence = confidence,
                SourceArtifactId = artifactId,
                Notes = notes,
            },
        };
    }

    private static ArchitectureLifecycleScope InferLifecycleScopeForIndex(string sourceText, int matchIndex)
    {
        List<(int Index, ArchitectureLifecycleScope Scope)> boundaries = [];

        AddLifecycleBoundaries(sourceText, "target state", ArchitectureLifecycleScope.TargetState, boundaries);
        AddLifecycleBoundaries(sourceText, "to-be", ArchitectureLifecycleScope.TargetState, boundaries);
        AddLifecycleBoundaries(sourceText, "current state", ArchitectureLifecycleScope.CurrentState, boundaries);
        AddLifecycleBoundaries(sourceText, "as-is", ArchitectureLifecycleScope.CurrentState, boundaries);

        if (boundaries.Count == 0)
        {
            return ArchitectureLifecycleScope.Unspecified;
        }

        boundaries.Sort(static (left, right) => left.Index.CompareTo(right.Index));

        ArchitectureLifecycleScope scope = ArchitectureLifecycleScope.Unspecified;

        foreach ((int index, ArchitectureLifecycleScope sectionScope) in boundaries)
        {
            if (index >= matchIndex)
            {
                break;
            }

            scope = sectionScope;
        }

        return scope;
    }

    private static void AddLifecycleBoundaries(
        string sourceText,
        string marker,
        ArchitectureLifecycleScope scope,
        List<(int Index, ArchitectureLifecycleScope Scope)> boundaries)
    {
        int searchStart = 0;

        while (searchStart < sourceText.Length)
        {
            int index = sourceText.IndexOf(marker, searchStart, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
            {
                break;
            }

            boundaries.Add((index, scope));
            searchStart = index + marker.Length;
        }
    }

    [GeneratedRegex(@"(?im)^(?:component|service)\s*[:\-]\s*(?<name>.+)$")]
    private static partial Regex ComponentLinePattern();

    [GeneratedRegex(@"(?im)^(?:requirement|req)\s*[:\-]\s*(?<name>.+)$")]
    private static partial Regex RequirementLinePattern();
}
