namespace ArchLucid.Core.Findings;

/// <summary>Deterministic insight-density demotion threshold (TB-382 Phase 1).</summary>
public sealed class InsightDensityGateOptions
{
    public const string SectionPath = "ArchLucid:Findings:InsightDensityGate";

    /// <summary>
    ///     Scores below this value demote when the candidate also lacks resolvable package evidence.
    ///     Default 65 sits between coverage-shaped golden medians (60) and path/contradiction medians (75–85)
    ///     measured on case-01..case-63 after DX-50. Host JSON override still wins.
    /// </summary>
    public int DemotionThreshold
    {
        get;
        set;
    } = 65;

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

    /// <summary>
    ///     When true in Real execution mode with a Premium deployment, proposes up to
    ///     <see cref="MaxGeneratedInsightFindingsPerSnapshot" /> novel findings from bounded package evidence.
    /// </summary>
    public bool EnableInsightGenerator
    {
        get;
        set;
    } = false;

    /// <summary>Hard ceiling on Premium-tier insight-generator completions per findings snapshot.</summary>
    public int MaxGeneratedInsightFindingsPerSnapshot
    {
        get;
        set;
    } = 8;

    /// <summary>
    ///     When true in Real execution mode, tenant novelty rates from
    ///     <see cref="IFindingInsightSignalRepository.ListNoveltyRatesAsync" /> rank engine findings in the Premium
    ///     judge-cap selector (requires <see cref="EnableLlmJudge" /> and
    ///     <see cref="EnableLlmJudgeForEngineFindings" />) and in the insight generator sample when
    ///     <see cref="EnableInsightGenerator" /> is also true. Internal ranking only — not a buyer claim or G-REAL-06
    ///     proof. Default false; Simulator ignores this flag.
    /// </summary>
    public bool PreferHighNoveltyEngines
    {
        get;
        set;
    } = false;

    /// <summary>Trailing window for <see cref="PreferHighNoveltyEngines" /> rate lookup. Default 90 days.</summary>
    public int NoveltyRateWindowDays
    {
        get;
        set;
    } = 90;

    /// <summary>
    ///     When true in Real execution mode with a Premium deployment, extracts architecture assumptions from in-batch
    ///     prose documents and emits findings only when a deterministic contradiction against declaration/inventory/graph
    ///     succeeds (DX-55). Default false; Simulator ignores this flag.
    /// </summary>
    public bool EnableProseAssumptionExtraction
    {
        get;
        set;
    } = false;

    /// <summary>Hard ceiling on prose-assumption candidates extracted per findings snapshot (DX-55).</summary>
    public int MaxProseAssumptionCandidatesPerSnapshot
    {
        get;
        set;
    } = 8;

    /// <summary>Hard ceiling on prose-assumption contradiction findings emitted per findings snapshot (DX-55).</summary>
    public int MaxProseAssumptionFindingsPerSnapshot
    {
        get;
        set;
    } = 8;

    /// <summary>
    ///     When true in Real execution mode, tenant verification confirmed rates rank engine findings in the Premium
    ///     judge-cap selector (requires <see cref="EnableLlmJudge" /> and
    ///     <see cref="EnableLlmJudgeForEngineFindings" />). Internal ranking only — not a buyer claim. Default false;
    ///     Simulator ignores this flag (DX-56).
    /// </summary>
    public bool PreferHighVerificationEngines
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     Minimum verifiable findings per engine before a verification confirmed-rate prior is applied (DX-56). Default
    ///     20.
    /// </summary>
    public int VerificationPriorMinSample
    {
        get;
        set;
    } = 20;

    /// <summary>Trailing window for <see cref="PreferHighVerificationEngines" /> rate lookup. Default 90 days (DX-56).</summary>
    public int VerificationPriorWindowDays
    {
        get;
        set;
    } = 90;
}
