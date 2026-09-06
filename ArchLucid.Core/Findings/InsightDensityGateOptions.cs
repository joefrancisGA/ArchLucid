namespace ArchLucid.Core.Findings;

/// <summary>Deterministic insight-density demotion threshold (TB-382 Phase 1).</summary>
public sealed class InsightDensityGateOptions
{
    public const string SectionPath = "ArchLucid:Findings:InsightDensityGate";

    /// <summary>
    ///     Scores below this value demote when the candidate also lacks architecture anchors and concrete evidence.
    ///     Default 50 balances obvious checklist phrasing against evidence-bound findings.
    /// </summary>
    public int DemotionThreshold
    {
        get;
        set;
    } = 50;

    /// <summary>Jaccard similarity at or above this value applies the maximum duplication penalty.</summary>
    public double HighDuplicationSimilarityThreshold
    {
        get;
        set;
    } = 0.85;

    /// <summary>Jaccard similarity at or above this value applies the moderate duplication penalty.</summary>
    public double ModerateDuplicationSimilarityThreshold
    {
        get;
        set;
    } = 0.70;

    /// <summary>
    ///     When true and a Premium (Reasoning) deployment is configured, promoted candidates receive a TB-382 Phase 2
    ///     LLM judgment pass. Default false preserves deterministic-only Phase 1 behavior.
    /// </summary>
    public bool EnableLlmJudge
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     Hard ceiling on Premium-tier judge completions per findings snapshot. Prevents unbounded cost when many
    ///     findings are promoted.
    /// </summary>
    public int MaxJudgedFindingsPerSnapshot
    {
        get;
        set;
    } = 40;

    /// <summary>
    ///     When true with <see cref="EnableLlmJudge" /> and a Premium deployment, deterministic engine findings may
    ///     receive So What enrichment. Default false — engine path is opt-in separately from agent architecture findings.
    /// </summary>
    public bool EnableLlmJudgeForEngineFindings
    {
        get;
        set;
    } = false;
}
