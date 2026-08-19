namespace ArchLucid.Core.Configuration;

/// <summary>What-if branch limits and cost surfacing for Socratic intake (R12 / ADR 0052).</summary>
public sealed class DraftIntakeBranchOptions
{
    public const string SectionName = "DraftIntakeBranch";

    /// <summary>Maximum child branches allowed per parent draft. Clamped to 1–20 at runtime.</summary>
    public int MaxBranchesPerParentDraft
    {
        get;
        set;
    } = 3;

    /// <summary>
    ///     Operator-facing estimate for a single branch submit (full authority pipeline).
    ///     Marketing-adjacent — label as estimate in UI (SAQ-011).
    /// </summary>
    public decimal EstimatedBranchRunCostUsd
    {
        get;
        set;
    } = 1.0m;
}
