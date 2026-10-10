using System.Collections.Concurrent;

using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class InMemoryAdvisoryDraftOperationStore : IAdvisoryDraftOperationStore
{
    private readonly ConcurrentDictionary<string, AdvisoryDraftOperationRecord> _records = new(StringComparer.Ordinal);

    public Task<AdvisoryDraftOperationCreateResult> CreatePendingAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        Guid operationId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        string key = BuildKey(scope, operationId);

        AdvisoryDraftOperationRecord record = new()
        {
            OperationId = operationId,
            Scope = scope,
            State = OperationState.Pending,
            StepLabel = AdvisoryDraftOperationSteps.Queued,
            CurrentStep = 0,
            CreatedUtc = now,
            HeartbeatUtc = now,
        };

        if (!_records.TryAdd(key, record))
        {
            if (!_records.TryGetValue(key, out AdvisoryDraftOperationRecord? existing) || existing is null)
            {
                throw new InvalidOperationException("Failed to register advisory draft operation.");
            }

            return Task.FromResult(new AdvisoryDraftOperationCreateResult(existing, Created: false));
        }

        return Task.FromResult(new AdvisoryDraftOperationCreateResult(record, Created: true));
    }

    public Task<AdvisoryDraftOperationRecord?> GetAsync(
        string operationId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload)
            || kind != OperationIdKind.Draft
            || !Guid.TryParse(payload, out Guid parsedId))
        {
            return Task.FromResult<AdvisoryDraftOperationRecord?>(null);
        }

        _records.TryGetValue(BuildKey(scope, parsedId), out AdvisoryDraftOperationRecord? record);
        return Task.FromResult(record);
    }

    public Task MarkRunningAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default)
    {
        UpdateRecord(scope, operationId, static record =>
        {
            record.State = OperationState.Running;
            record.StepLabel = AdvisoryDraftOperationSteps.ReadingOverview;
            record.CurrentStep = 1;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task UpdateProgressAsync(
        ScopeContext scope,
        string operationId,
        string stepLabel,
        int currentStep,
        CancellationToken cancellationToken = default)
    {
        UpdateRecord(scope, operationId, record =>
        {
            record.StepLabel = stepLabel;
            record.CurrentStep = currentStep;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task MarkSucceededAsync(
        ScopeContext scope,
        string operationId,
        DraftArchitectureRequestResponse result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(result);

        UpdateRecord(scope, operationId, record =>
        {
            record.State = OperationState.Succeeded;
            record.StepLabel = AdvisoryDraftOperationSteps.Complete;
            record.CurrentStep = AdvisoryDraftOperationSteps.TotalSteps;
            record.Result = result;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task MarkFailedAsync(
        ScopeContext scope,
        string operationId,
        string errorMessage,
        CancellationToken cancellationToken = default)
    {
        UpdateRecord(scope, operationId, record =>
        {
            record.State = OperationState.Failed;
            record.StepLabel = AdvisoryDraftOperationSteps.Failed;
            record.ErrorMessage = errorMessage;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task MarkCanceledAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default)
    {
        UpdateRecord(scope, operationId, record =>
        {
            if (record.State is OperationState.Succeeded or OperationState.Failed or OperationState.Canceled)
            {
                return;
            }

            record.State = OperationState.Canceled;
            record.StepLabel = AdvisoryDraftOperationSteps.Canceled;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        }, cancellationToken);

        return Task.CompletedTask;
    }

    private void UpdateRecord(
        ScopeContext scope,
        string operationId,
        Action<AdvisoryDraftOperationRecord> mutate,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload)
            || kind != OperationIdKind.Draft
            || !Guid.TryParse(payload, out Guid parsedId))
        {
            return;
        }

        if (!_records.TryGetValue(BuildKey(scope, parsedId), out AdvisoryDraftOperationRecord? record))
        {
            return;
        }

        mutate(record);
    }

    internal static string BuildKey(ScopeContext scope, Guid operationId) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{operationId:N}";
}
