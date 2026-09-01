using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class DifficultyBasedExtractionRouter
{
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
}
