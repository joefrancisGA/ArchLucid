namespace ArchLucid.Application.Agents;

/// <summary>Offline faithfulness harness rollup (TB-683 / TB-2105).</summary>
public sealed record FaithfulnessHarnessSummary(
    string FormatVersion,
    int CasesEvaluated,
    double PositiveReadinessSupportRatio,
    double NegativeControlSupportRatio,
    double CombinedDiagnosticSupportRatio,
    double FloorMinSupportRatio);
