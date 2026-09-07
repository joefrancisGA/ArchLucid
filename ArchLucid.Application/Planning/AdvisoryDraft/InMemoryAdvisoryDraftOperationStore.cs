using System.Collections.Concurrent;

using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class InMemoryAdvisoryDraftOperationStore : IAdvisoryDraftOperationStore
{
    private readonly ConcurrentDictionary<string, AdvisoryDraftOperationRecord> _records = new(StringComparer.Ordinal);

    public AdvisoryDraftOperationCreateResult CreatePending(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

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

            return new AdvisoryDraftOperationCreateResult(existing, Created: false);
        }

        return new AdvisoryDraftOperationCreateResult(record, Created: true);
    }

    public bool TryGet(string operationId, ScopeContext scope, out AdvisoryDraftOperationRecord? record)
    {
        record = null;

        if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload)
            || kind != OperationIdKind.Draft
            || !Guid.TryParse(payload, out Guid parsedId))
        {
            return false;
        }

        return _records.TryGetValue(BuildKey(scope, parsedId), out record);
    }

    public void MarkRunning(string operationId)
    {
        UpdateRecord(operationId, static record =>
        {
            record.State = OperationState.Running;
            record.StepLabel = AdvisoryDraftOperationSteps.ReadingOverview;
            record.CurrentStep = 1;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        });
    }

    public void UpdateProgress(string operationId, string stepLabel, int currentStep)
    {
        UpdateRecord(operationId, record =>
        {
            record.StepLabel = stepLabel;
            record.CurrentStep = currentStep;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        });
    }

    public void MarkSucceeded(string operationId, DraftArchitectureRequestResponse result)
    {
        ArgumentNullException.ThrowIfNull(result);

        UpdateRecord(operationId, record =>
        {
            record.State = OperationState.Succeeded;
            record.StepLabel = AdvisoryDraftOperationSteps.Complete;
            record.CurrentStep = AdvisoryDraftOperationSteps.TotalSteps;
            record.Result = result;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        });
    }

    public void MarkFailed(string operationId, string errorMessage)
    {
        UpdateRecord(operationId, record =>
        {
            record.State = OperationState.Failed;
            record.StepLabel = AdvisoryDraftOperationSteps.Failed;
            record.ErrorMessage = errorMessage;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        });
    }

    public void MarkCanceled(string operationId)
    {
        UpdateRecord(operationId, record =>
        {
            if (record.State is OperationState.Succeeded or OperationState.Failed or OperationState.Canceled)
                return;

            record.State = OperationState.Canceled;
            record.StepLabel = AdvisoryDraftOperationSteps.Canceled;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        });
    }

    private void UpdateRecord(string operationId, Action<AdvisoryDraftOperationRecord> mutate)
    {
        foreach (AdvisoryDraftOperationRecord record in _records.Values)
        {
            if (!string.Equals(OperationIdCodec.ForDraft(record.OperationId), operationId, StringComparison.Ordinal))
                continue;

            mutate(record);
            return;
        }
    }

    internal static string BuildKey(ScopeContext scope, Guid operationId) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{operationId:N}";
}
