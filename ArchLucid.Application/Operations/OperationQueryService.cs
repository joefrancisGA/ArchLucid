using ArchLucid.Application.Jobs;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Operations;

public sealed class OperationQueryService(
  IBackgroundJobInfoReader jobInfoReader,
  IBackgroundJobTenantAccessVerifier tenantAccessVerifier,
  IRunRepository runRepository,
  IAgentTaskRepository agentTaskRepository,
  IOperationCancellationRegistry cancellationRegistry,
  IAdvisoryDraftOperationStore advisoryDraftOperationStore) : IOperationQueryService
{
  private readonly IBackgroundJobInfoReader _jobInfoReader =
    jobInfoReader ?? throw new ArgumentNullException(nameof(jobInfoReader));

  private readonly IBackgroundJobTenantAccessVerifier _tenantAccessVerifier =
    tenantAccessVerifier ?? throw new ArgumentNullException(nameof(tenantAccessVerifier));

  private readonly IRunRepository _runRepository =
    runRepository ?? throw new ArgumentNullException(nameof(runRepository));

  private readonly IAgentTaskRepository _agentTaskRepository =
    agentTaskRepository ?? throw new ArgumentNullException(nameof(agentTaskRepository));

  private readonly IOperationCancellationRegistry _cancellationRegistry =
    cancellationRegistry ?? throw new ArgumentNullException(nameof(cancellationRegistry));

  private readonly IAdvisoryDraftOperationStore _advisoryDraftOperationStore =
    advisoryDraftOperationStore ?? throw new ArgumentNullException(nameof(advisoryDraftOperationStore));

  public async Task<OperationDetail?> GetAsync(
    string operationId,
    ScopeContext scope,
    CancellationToken cancellationToken = default)
  {
    ArgumentException.ThrowIfNullOrWhiteSpace(operationId);
    ArgumentNullException.ThrowIfNull(scope);

    if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload))
      return null;

    return kind switch
    {
      OperationIdKind.Job => await GetJobOperationAsync(operationId, payload, scope, cancellationToken),
      OperationIdKind.Run => await GetRunOperationAsync(operationId, payload, scope, cancellationToken),
      OperationIdKind.Draft => GetDraftOperation(operationId, scope, cancellationToken),
      _ => null
    };
  }

  private OperationDetail? GetDraftOperation(
    string operationId,
    ScopeContext scope,
    CancellationToken cancellationToken)
  {
    cancellationToken.ThrowIfCancellationRequested();

    if (!_advisoryDraftOperationStore.TryGet(operationId, scope, out AdvisoryDraftOperationRecord? record)
        || record is null)
    {
      return null;
    }

    return AdvisoryDraftOperationProjector.Project(
      operationId,
      record,
      _cancellationRegistry.IsCancelRequested(scope, operationId));
  }

  private async Task<OperationDetail?> GetJobOperationAsync(
    string operationId,
    string jobId,
    ScopeContext scope,
    CancellationToken cancellationToken)
  {
    if (!await _tenantAccessVerifier.IsAccessibleAsync(jobId, scope, cancellationToken))
      return null;

    BackgroundJobInfo? job = await _jobInfoReader.GetInfoAsync(jobId, cancellationToken);

    if (job is null)
      return null;

    return BackgroundJobOperationProjector.Project(
      operationId,
      job,
      _cancellationRegistry.IsCancelRequested(scope, operationId));
  }

  private async Task<OperationDetail?> GetRunOperationAsync(
    string operationId,
    string runIdRaw,
    ScopeContext scope,
    CancellationToken cancellationToken)
  {
    if (!Guid.TryParse(runIdRaw, out Guid runId))
      return null;

    RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

    if (run is null)
      return null;

    IReadOnlyList<Contracts.Agents.AgentTask> tasks =
      await _agentTaskRepository.GetByRunIdAsync(scope, runId.ToString("D"), cancellationToken);

    return RunOperationProjector.Project(
      operationId,
      run,
      tasks,
      _cancellationRegistry.IsCancelRequested(scope, operationId));
  }
}
