namespace ArchLucid.Core.Findings;

/// <summary>
///     Semantic support band scoring options. Emit stays heuristic (AS-057). Working Career Real finalize
///     runs the Premium LLM judge by default (ADR 0099).
/// </summary>
public sealed class FindingSemanticSupportBandOptions
{
    public const string SectionPath = "ArchLucid:Findings:SemanticSupportBand";

    /// <summary>
    ///     When true, the findings merge/emit path may call the LLM judge. Default false (AS-074) — emit
    ///     stays the deterministic quote-overlap heuristic so pipeline latency is not a sync LLM tax
    ///     (TB-1228). Finalize uses <see cref="EnableLlmJudgeOnFinalize"/> instead (ADR 0099).
    /// </summary>
    public bool EnableLlmJudge
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     When true, Working Career Real finalize/readiness runs the Premium LLM judge on Unchecked
    ///     decision-grade rows before warn/hold honesty. Default true (ADR 0099). Simulator/Fallback never
    ///     apply this flag — <see cref="FindingSemanticSupportBandFinalizeJudgePolicy"/>.
    /// </summary>
    public bool EnableLlmJudgeOnFinalize
    {
        get;
        set;
    } = true;
}
