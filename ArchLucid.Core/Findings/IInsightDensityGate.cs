namespace ArchLucid.Core.Findings;

/// <summary>
///     Scores candidate observations for insight density and routes them to findings vs checklist coverage (TB-382).
/// </summary>
public interface IInsightDensityGate
{
    InsightDensityGateResult Score(
        InsightDensityGateCandidate candidate,
        IReadOnlyList<InsightDensityGateCandidate> snapshotPeers);
}
