using ArchLucid.Application.Authority;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application;

public sealed partial class ReplayRunService
{
    /// <inheritdoc />
    public async Task<string> PrepareReplayRunAsync(string originalRunId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);

        ArchitectureRunDetail sourceDetail = await _runDetailQueryService.GetRunDetailAsync(originalRunId, cancellationToken) ??
                                             throw new RunNotFoundException(originalRunId);
        ArchitectureRun originalRun = sourceDetail.Run;
        List<AgentTask> tasks = sourceDetail.Tasks;
        cancellationToken.ThrowIfCancellationRequested();

        if (tasks.Count == 0)
            throw new InvalidOperationException($"No tasks found for run '{originalRunId}'.");

        ArchitectureRequest request = await _requestRepository.GetByIdAsync(originalRun.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{originalRun.RequestId}' not found.");

        if (await _agentEvidencePackageRepository.GetByRunIdAsync(originalRunId, cancellationToken) is null)
            throw new InvalidOperationException($"Evidence package for run '{originalRunId}' not found.");

        string replayRunId = Guid.NewGuid().ToString("N");
        Guid replayGuid = Guid.Parse(replayRunId);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? sourceAuthorityRun = null;

        if (Guid.TryParse(originalRunId, out Guid originalGuid))
            sourceAuthorityRun = await _authorityRunRepository.GetByIdAsync(scope, originalGuid, cancellationToken);

        RunRecord replayAuthority = ReplayAuthorityRunRecordFactory.CreateForReplay(replayGuid, scope, sourceAuthorityRun, request);
        await _authorityRunRepository.SaveAsync(replayAuthority, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();

        List<AgentTask> replayTasks = tasks.Select(t => new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = replayRunId,
            AgentType = t.AgentType,
            Objective = t.Objective,
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = t.EvidenceBundleRef,
            AllowedTools = t.AllowedTools.ToList(),
            AllowedSources = t.AllowedSources.ToList()
        }).ToList();

        // SimulatorExecutionTraceRecordingExecutor persists dbo.AgentExecutionTraces with FK_AgentExecutionTraces_Task.
        await _taskRepository.CreateManyAsync(replayTasks, cancellationToken);

        return replayRunId;
    }
}
