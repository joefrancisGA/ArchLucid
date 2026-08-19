using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Jobs;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operations;

public sealed class OperationCancelService(
    IOperationQueryService operationQueryService,
    IOperationCancellationRegistry cancellationRegistry,
    OperationRunCancellationMarker runCancellationMarker,
    IBackgroundJobInfoReader jobInfoReader,
    IBackgroundJobCancellationWriter jobCancellationWriter,
    IBackgroundJobTenantAccessVerifier tenantAccessVerifier) : IOperationCancelService
{
    private readonly IOperationQueryService _operationQueryService =
        operationQueryService ?? throw new ArgumentNullException(nameof(operationQueryService));

    private readonly IOperationCancellationRegistry _cancellationRegistry =
        cancellationRegistry ?? throw new ArgumentNullException(nameof(cancellationRegistry));

    private readonly OperationRunCancellationMarker _runCancellationMarker =
        runCancellationMarker ?? throw new ArgumentNullException(nameof(runCancellationMarker));

    private readonly IBackgroundJobInfoReader _jobInfoReader =
        jobInfoReader ?? throw new ArgumentNullException(nameof(jobInfoReader));

    private readonly IBackgroundJobCancellationWriter _jobCancellationWriter =
        jobCancellationWriter ?? throw new ArgumentNullException(nameof(jobCancellationWriter));

    private readonly IBackgroundJobTenantAccessVerifier _tenantAccessVerifier =
        tenantAccessVerifier ?? throw new ArgumentNullException(nameof(tenantAccessVerifier));

    public async Task<OperationDetail> RequestCancelAsync(
        string operationId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(operationId);
        ArgumentNullException.ThrowIfNull(scope);

        OperationDetail? current = await _operationQueryService.GetAsync(operationId, scope, cancellationToken);

        if (current is null)
            throw new RunNotFoundException(operationId);

        if (current.State is OperationState.Succeeded or OperationState.Failed or OperationState.Canceled)
            throw new ConflictException($"Operation '{operationId}' is already terminal.");

        _cancellationRegistry.TryRequestCancel(scope, operationId);

        if (OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload))
        {
            if (kind == OperationIdKind.Run && Guid.TryParse(payload, out Guid runId))
                await _runCancellationMarker.TryMarkRunCanceledAsync(scope, runId, cancellationToken);

            if (kind == OperationIdKind.Job)
                await TryMarkBackgroundJobCanceledAsync(payload, scope, cancellationToken);
        }

        OperationDetail? updated = await _operationQueryService.GetAsync(operationId, scope, cancellationToken);

        if (updated is null)
            throw new RunNotFoundException(operationId);

        return updated;
    }

    private async Task TryMarkBackgroundJobCanceledAsync(
        string jobId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!await _tenantAccessVerifier.IsAccessibleAsync(jobId, scope, cancellationToken))
            return;

        BackgroundJobInfo? job = await _jobInfoReader.GetInfoAsync(jobId, cancellationToken);

        if (job is null)
            return;

        if (job.State is not BackgroundJobState.Pending and not BackgroundJobState.Running)
            return;

        await _jobCancellationWriter.MarkCanceledAsync(jobId, cancellationToken);
    }
}
