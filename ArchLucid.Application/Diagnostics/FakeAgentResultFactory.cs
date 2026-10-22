using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Diagnostics;

/* This gives you a deterministic way to generate:
    a topology proposal
    a cost proposal
    a compliance proposal

    ...using the real run and task IDs from your system.

    That means you can now do a real end-to-end smoke test without building live agents.*/
public static partial class FakeAgentResultFactory
{
    public static IReadOnlyList<AgentResult> CreateStarterResults(string runId, IReadOnlyCollection<AgentTask> tasks, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(tasks);
        ArgumentNullException.ThrowIfNull(request);
        AgentTask topologyTask = tasks.FirstOrDefault(t => t.AgentType == AgentType.Topology) ??
                                 throw new InvalidOperationException("Topology task was not found.");
        AgentTask costTask = tasks.FirstOrDefault(t => t.AgentType == AgentType.Cost) ?? throw new InvalidOperationException("Cost task was not found.");
        AgentTask complianceTask = tasks.FirstOrDefault(t => t.AgentType == AgentType.Compliance) ??
                                   throw new InvalidOperationException("Compliance task was not found.");
        AgentTask criticTask = tasks.FirstOrDefault(t => t.AgentType == AgentType.Critic) ?? throw new InvalidOperationException("Critic task was not found.");
        return
        [
            CreateTopologyResult(runId, topologyTask.TaskId, request), CreateCostResult(runId, costTask.TaskId, request),
            CreateComplianceResult(runId, complianceTask.TaskId, request), CreateCriticResult(runId, criticTask.TaskId, request)
        ];
    }
}
