namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// CI planted-defect recall floor for the golden incomplete fixture (TB-2342 item 55).
/// Heuristic title-pattern matching — raise only when golden matching accuracy improves.
/// </summary>
public static class ArchitectureIntelligenceGoldenRecallPolicy
{
    /// <summary>Minimum planted-defect recall for <see cref="GoldenIncompleteArchitectureFixture"/>.</summary>
    public const double GoldenIncompleteMinimumRecall = 0.25;
}
