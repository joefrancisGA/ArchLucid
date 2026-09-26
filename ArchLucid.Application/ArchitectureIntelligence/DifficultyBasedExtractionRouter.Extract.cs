using System.Text.RegularExpressions;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter
{
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

    [GeneratedRegex(@"(?im)^(?:component|service)\s*[:\-]\s*(?<name>.+)$")]
    private static partial Regex ComponentLinePattern();

    [GeneratedRegex(@"(?im)^(?:requirement|req)\s*[:\-]\s*(?<name>.+)$")]
    private static partial Regex RequirementLinePattern();
}
