namespace ArchLucid.Core.Findings;

/// <summary>
///     AS-074: optional Premium LLM semantic judge for Working support band scoring.
///     Default off — heuristic quote-overlap (AS-057) is the sync-safe default scorer.
/// </summary>
public sealed class FindingSemanticSupportBandOptions
{
    public const string SectionPath = "ArchLucid:Findings:SemanticSupportBand";

    /// <summary>
    ///     When true and a Premium deployment is configured, findings may receive an optional LLM semantic judge pass
    ///     for support-band scoring. Default false — same posture as
    ///     <see cref="InsightDensityGateOptions.EnableProseAssumptionExtraction" />.
    /// </summary>
    public bool EnableLlmJudge
    {
        get;
        set;
    } = false;
}
