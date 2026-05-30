using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

internal static class RealAgentExecutorParallelPhaseExecution
{
    internal static async Task<AgentResult[]> ExecutePhaseWhenAllAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> phaseTasks,
        IReadOnlyDictionary<string, AgentResult> persistedByTaskId,
        CancellationTokenSource linkedCancellation)
    {
        if (phaseTasks.Count == 0)
            return [];

        Task<AgentResult>[] tasks = new Task<AgentResult>[phaseTasks.Count];

        for (int index = 0; index < phaseTasks.Count; index++)
        {
            AgentTask phaseTaskItem = phaseTasks[index];
            persistedByTaskId.TryGetValue(phaseTaskItem.TaskId, out AgentResult? persistedResult);
            tasks[index] =
                RealAgentExecutorSingleHandlerExecution.ExecuteSingleAsync(
                    dependencies,
                    runId,
                    request,
                    evidence,
                    phaseTaskItem,
                    persistedResult,
                    linkedCancellation.Token);
        }

        if (!dependencies.AgentOutputBudgetGate.Value.PersistPartialOutputsOnBudgetExceeded)
            return await Task.WhenAll(tasks).ConfigureAwait(false);

        return await DrainParallelHandlersWithBudgetSupportAsync(tasks, phaseTasks, linkedCancellation)
            .ConfigureAwait(false);
    }

    private static async Task<AgentResult[]> DrainParallelHandlersWithBudgetSupportAsync(
        Task<AgentResult>[] tasks,
        IReadOnlyList<AgentTask> phaseTasks,
        CancellationTokenSource linkedCancellation)
    {
        HashSet<Task<AgentResult>> pending = new(tasks);
        CostLimitExceededException? budgetCause = null;

        while (pending.Count > 0)
        {
            Task<AgentResult> finishedTask = await Task.WhenAny(pending).ConfigureAwait(false);

            _ = pending.Remove(finishedTask);

            if (finishedTask.IsCompletedSuccessfully)
                continue;

            if (finishedTask.IsCanceled)
                continue;

            if (!finishedTask.IsFaulted)
                continue;

            Exception flattened = ExtractFailureRoot(finishedTask);

            CostLimitExceededException? candidate = ExtractCostLimitCause(flattened);

            budgetCause ??= candidate ?? throw flattened;

            if (!linkedCancellation.IsCancellationRequested)
                await linkedCancellation.CancelAsync();
        }

        AgentResult[] orderedSuccesses =
            SnapshotSuccessfulResultsPreservePhaseTaskOrder(tasks, phaseTasks.Count);

        if (budgetCause is not null && orderedSuccesses.Length > 0)
            throw new AgentRunPartialBudgetException(budgetCause, orderedSuccesses);

        if (budgetCause is not null)
            throw budgetCause;

        if (orderedSuccesses.Length != phaseTasks.Count)
            throw new InvalidOperationException("Parallel agent scheduling finished without aligning task outcomes.");

        return orderedSuccesses;
    }

    private static Exception ExtractFailureRoot(Task<AgentResult> faultedTask)
    {
        Exception ex = faultedTask.Exception ?? throw new InvalidOperationException("Expected faulted task exception.");

        if (ex is not AggregateException aggregate)
            return ex;

        AggregateException flattened = aggregate.Flatten();

        return flattened.InnerExceptions.Count == 1 ? flattened.InnerExceptions[0] : throw flattened;
    }

    private static CostLimitExceededException? ExtractCostLimitCause(Exception ex)
    {
        for (Exception? walker = ex; walker is not null; walker = walker.InnerException)
        {
            if (walker is CostLimitExceededException matched)
                return matched;
        }

        return ex is not AggregateException aggregate
            ? null
            : aggregate.Flatten().InnerExceptions.Select(ExtractCostLimitCause).OfType<CostLimitExceededException>().FirstOrDefault();
    }

    private static AgentResult[] SnapshotSuccessfulResultsPreservePhaseTaskOrder(Task<AgentResult>[] tasks, int phaseLen)
    {
        List<AgentResult> successes = [];

        for (int index = 0; index < phaseLen; index++)
        {
            Task<AgentResult> task = tasks[index];

            if (task.Status != TaskStatus.RanToCompletion)
                continue;

            successes.Add(task.Result);
        }

        return successes.Count == 0 ? [] : successes.ToArray();
    }
}
