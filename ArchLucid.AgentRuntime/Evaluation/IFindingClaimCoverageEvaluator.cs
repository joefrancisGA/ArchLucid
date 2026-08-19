using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Checks whether findings have acceptable evidence references or explicit low-confidence
///     labels before they are promoted to sponsor-facing or operator surfaces.
/// </summary>
public interface IFindingClaimCoverageEvaluator
{
    /// <summary>
    ///     Evaluates citation coverage for the supplied findings.
    /// </summary>
    /// <param name="findings">Findings produced by an agent result.</param>
    /// <returns>A <see cref="FindingClaimCoverageReport" /> with coverage ratio and unsupported IDs.</returns>
    FindingClaimCoverageReport Evaluate(IReadOnlyList<ArchitectureFinding> findings);
}
