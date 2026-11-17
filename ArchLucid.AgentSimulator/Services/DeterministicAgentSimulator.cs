using ArchLucid.Core.AgentSimulation;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentSimulator.Services;

public sealed class DeterministicAgentSimulator : IAgentExecutor
{
    public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(tasks);

        List<AgentResult> results = [];

        foreach (AgentTask task in tasks.OrderBy(AgentTypeKeys.ResolveDispatchKey, StringComparer.OrdinalIgnoreCase))
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                if (!RunIdsMatch(task.RunId, runId))

                    throw new InvalidOperationException(
                        $"Task '{task.TaskId}' belongs to run '{task.RunId}', not '{runId}'. " +
                        "Tasks from a different run must not be executed together.");

                string key = AgentTypeKeys.ResolveDispatchKey(task);
                AgentResult result = CreateResultForKey(runId, task.TaskId, request, key);
                results.Add(result);
            }
            catch (Exception ex)
            {
                string dispatchKey = AgentTypeKeys.ResolveDispatchKey(task);

                throw new AgentHandlerExecutionException(dispatchKey, task.AgentType, ex);
            }
        }

        return Task.FromResult<IReadOnlyList<AgentResult>>(results);
    }

    private static bool RunIdsMatch(string? taskRunId, string runId)
    {
        bool taskIsGuid = Guid.TryParse(taskRunId, out Guid taskGuid);
        bool runIsGuid = Guid.TryParse(runId, out Guid runGuid);

        // Persisted identities are GUIDs, but the deterministic simulator also
        // supports matching opaque labels in existing offline golden scenarios.
        // Never equate a GUID identity with an opaque label.
        return taskIsGuid && runIsGuid
            ? taskGuid == runGuid
            : !taskIsGuid && !runIsGuid &&
              string.Equals(taskRunId, runId, StringComparison.Ordinal);
    }

    private static AgentResult CreateResultForKey(
        string runId,
        string taskId,
        ArchitectureRequest request,
        string agentTypeKey)
    {
        if (string.Equals(agentTypeKey, AgentTypeKeys.Topology, StringComparison.OrdinalIgnoreCase))

            return FakeScenarioFactory.CreateTopologyResult(runId, taskId, request);

        if (string.Equals(agentTypeKey, AgentTypeKeys.Cost, StringComparison.OrdinalIgnoreCase))
            return FakeScenarioFactory.CreateCostResult(runId, taskId, request);

        if (string.Equals(agentTypeKey, AgentTypeKeys.Compliance, StringComparison.OrdinalIgnoreCase))

            return FakeScenarioFactory.CreateComplianceResult(runId, taskId, request);

        return string.Equals(agentTypeKey, AgentTypeKeys.Critic, StringComparison.OrdinalIgnoreCase)
            ? FakeScenarioFactory.CreateCriticResult(runId, taskId, request)
            : throw new InvalidOperationException($"Unsupported agent type key: {agentTypeKey}");
    }
}
