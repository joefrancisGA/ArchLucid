using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>TB-2226: fail-closed on recorded quality-gate rejections for Real PilotStrict runs.</summary>
public static class RealCommitAgentOutputQualityGateEvaluator
{
    public static IReadOnlyList<string> GetBlockingReasons(
        ArchitectureRun run,
        AgentOutputQualityGateOptions options,
        IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(traces);

        if (run.StructuralExecutionMode != StructuralExecutionMode.Real)
            return [];

        if (!options.Enabled || options.Mode != AgentOutputQualityGateMode.PilotStrict)
            return [];

        IReadOnlyList<AgentExecutionTrace> latestTracesPerTask =
            AgentExecutionTraceLatestPerTaskSelector.Select(traces);

        List<string> reasons = [];

        foreach (AgentExecutionTrace trace in latestTracesPerTask)
        {
            AgentOutputQualityGateOutcome? outcome = trace.RecordedQualityGateOutcome;

            // QualityRejected is the durable commit-blocking flag and can be patched independently of
            // RecordedQualityGateOutcome; do not require outcome to be null or Rejected to honor it.
            if (outcome == AgentOutputQualityGateOutcome.Rejected || trace.QualityRejected)
            {
                reasons.Add(
                    $"Agent output quality gate rejected trace {trace.TraceId} ({trace.AgentType}).");
            }
        }

        return reasons;
    }
}
