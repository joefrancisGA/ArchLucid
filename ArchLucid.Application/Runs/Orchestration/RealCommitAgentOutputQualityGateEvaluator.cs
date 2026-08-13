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

        List<string> reasons = [];

        foreach (AgentExecutionTrace trace in traces)
        {
            AgentOutputQualityGateOutcome? outcome = trace.RecordedQualityGateOutcome;

            if (outcome == AgentOutputQualityGateOutcome.Rejected
                || (outcome is null && trace.QualityRejected))
            {
                reasons.Add(
                    $"Agent output quality gate rejected trace {trace.TraceId} ({trace.AgentType}).");
            }
        }

        return reasons;
    }
}
