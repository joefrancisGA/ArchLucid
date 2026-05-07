using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Explanation;

namespace ArchLucid.Core.Agents;

/// <summary>
///     Computes whether PilotStrict agent-output checks fail for persisted traces or optional aggregate explanation
///     faithfulness (bounded inputs — mirrors post-run evaluation semantics).
/// </summary>
public interface IRunAgentOutputPilotEvidenceAggregator
{
    /// <summary>
    ///     Returns <see langword="true"/> when quality gate options are enabled in PilotStrict mode and evaluation fails.
    /// </summary>
    bool WouldPilotStrictBlockSponsorEvidence(
        IReadOnlyList<AgentExecutionTrace> traces,
        RunExplanationSummary? explanationSummary);
}
