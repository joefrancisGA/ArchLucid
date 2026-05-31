using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Wraps an inner <see cref="IAgentExecutor" /> and persists one <see cref="AgentExecutionTrace" /> per
///     synthetic <see cref="AgentResult" /> so Simulator-mode runs expose the same trace surface as
///     <see cref="RealAgentExecutor" /> (audit API, analysis reports, exports).
/// </summary>
public sealed class SimulatorExecutionTraceRecordingExecutor(
    IAgentExecutor innerExecutor,
    IAgentExecutionTraceRecorder traceRecorder) : IAgentExecutor
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(innerExecutor);

        IReadOnlyList<AgentResult> results = await innerExecutor.ExecuteAsync(
            runId,
            request,
            evidence,
            tasks,
            cancellationToken);

        ILookup<string, AgentTask> tasksById = tasks.ToLookup(t => t.TaskId);

        foreach (AgentResult result in results)
        {
            cancellationToken.ThrowIfCancellationRequested();

            string resultJson = JsonSerializer.Serialize(result, TraceJsonOptions);
            AgentTask? task = tasksById[result.TaskId].FirstOrDefault();

            string userPrompt = task is not null
                ? $"Simulator task: AgentType={task.AgentType}; Objective: {task.Objective}"
                : $"Simulator task TaskId={result.TaskId} (task row not found in batch).";

            const string simulatorSystem =
                "ArchLucid AgentExecution:Mode=Simulator. Deterministic fake AgentResult (no LLM). " +
                "Traces are persisted for API parity with RealAgentExecutor.";

            AgentPromptReproMetadata promptRepro = new(
                "simulator-deterministic",
                "1.0.0",
                AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(simulatorSystem),
                null);

            await traceRecorder.RecordAsync(
                runId,
                result.TaskId,
                result.AgentType,
                simulatorSystem,
                userPrompt,
                resultJson,
                resultJson,
                true,
                null,
                promptRepro,
                null,
                null,
                null,
                AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
                AgentExecutionTraceModelMetadata.SimulatorModelVersion,
                true,
                null,
                cancellationToken: cancellationToken);
        }

        return results;
    }
}
