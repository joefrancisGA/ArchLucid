using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

/// <summary>
///     Tenant SQL-backed advisory draft operation store (DR-14). Replaces the process-local singleton on SQL hosts.
/// </summary>
public sealed class SqlAdvisoryDraftOperationStore(IAdvisoryDraftOperationRepository repository) : IAdvisoryDraftOperationStore
{
    private readonly IAdvisoryDraftOperationRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public AdvisoryDraftOperationCreateResult CreatePending(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        Guid operationId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        AdvisoryDraftOperationRow row = BuildRow(scope, operationId, now);
        bool inserted = _repository.TryInsertPendingAsync(row, CancellationToken.None).GetAwaiter().GetResult();

        if (!inserted)
        {
            AdvisoryDraftOperationRow? existing = _repository
                .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, operationId, CancellationToken.None)
                .GetAwaiter()
                .GetResult()
                ?? throw new InvalidOperationException("Failed to register advisory draft operation.");

            return new AdvisoryDraftOperationCreateResult(MapToRecord(scope, existing), Created: false);
        }

        return new AdvisoryDraftOperationCreateResult(MapToRecord(scope, row), Created: true);
    }

    public bool TryGet(string operationId, ScopeContext scope, out AdvisoryDraftOperationRecord? record)
    {
        record = null;

        if (!TryParseDraftOperationId(operationId, out Guid parsedId))
        {
            return false;
        }

        AdvisoryDraftOperationRow? row = _repository
            .GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, parsedId, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        if (row is null)
        {
            return false;
        }

        record = MapToRecord(scope, row);
        return true;
    }

    public void MarkRunning(string operationId) =>
        UpdateRecord(operationId, static record =>
        {
            record.State = OperationState.Running;
            record.StepLabel = AdvisoryDraftOperationSteps.ReadingOverview;
            record.CurrentStep = 1;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        });

    public void UpdateProgress(string operationId, string stepLabel, int currentStep) =>
        UpdateRecord(operationId, record =>
        {
            record.StepLabel = stepLabel;
            record.CurrentStep = currentStep;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        });

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

    public void MarkFailed(string operationId, string errorMessage) =>
        UpdateRecord(operationId, record =>
        {
            record.State = OperationState.Failed;
            record.StepLabel = AdvisoryDraftOperationSteps.Failed;
            record.ErrorMessage = errorMessage;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        });

    public void MarkCanceled(string operationId) =>
        UpdateRecord(operationId, record =>
        {
            if (record.State is OperationState.Succeeded or OperationState.Failed or OperationState.Canceled)
            {
                return;
            }

            record.State = OperationState.Canceled;
            record.StepLabel = AdvisoryDraftOperationSteps.Canceled;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        });

    private void UpdateRecord(string operationId, Action<AdvisoryDraftOperationRecord> mutate)
    {
        if (!TryParseDraftOperationId(operationId, out Guid parsedId))
        {
            return;
        }

        AdvisoryDraftOperationRow? row = _repository
            .GetByOperationIdAsync(parsedId, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        if (row is null)
        {
            return;
        }

        ScopeContext scope = new()
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
        };
        AdvisoryDraftOperationRecord record = MapToRecord(scope, row);
        mutate(record);
        _repository.UpdateAsync(MapToRow(record), CancellationToken.None).GetAwaiter().GetResult();
    }

    private static bool TryParseDraftOperationId(string operationId, out Guid parsedId)
    {
        parsedId = default;

        if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload)
            || kind != OperationIdKind.Draft
            || !Guid.TryParse(payload, out parsedId))
        {
            return false;
        }

        return true;
    }

    private static AdvisoryDraftOperationRow BuildRow(ScopeContext scope, Guid operationId, DateTimeOffset now) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            OperationId = operationId,
            State = OperationState.Pending,
            StepLabel = AdvisoryDraftOperationSteps.Queued,
            CurrentStep = 0,
            CreatedUtc = now,
            HeartbeatUtc = now,
        };

    private static AdvisoryDraftOperationRecord MapToRecord(ScopeContext scope, AdvisoryDraftOperationRow row) =>
        new()
        {
            OperationId = row.OperationId,
            Scope = scope,
            State = row.State,
            StepLabel = row.StepLabel,
            CurrentStep = row.CurrentStep,
            CreatedUtc = row.CreatedUtc,
            HeartbeatUtc = row.HeartbeatUtc,
            CompletedUtc = row.CompletedUtc,
            Result = AdvisoryDraftOperationResultJsonCodec.Deserialize(row.ResultJson),
            ErrorMessage = row.ErrorMessage,
        };

    private static AdvisoryDraftOperationRow MapToRow(AdvisoryDraftOperationRecord record) =>
        new()
        {
            TenantId = record.Scope.TenantId,
            WorkspaceId = record.Scope.WorkspaceId,
            ProjectId = record.Scope.ProjectId,
            OperationId = record.OperationId,
            State = record.State,
            StepLabel = record.StepLabel,
            CurrentStep = record.CurrentStep,
            CreatedUtc = record.CreatedUtc,
            HeartbeatUtc = record.HeartbeatUtc,
            CompletedUtc = record.CompletedUtc,
            ResultJson = AdvisoryDraftOperationResultJsonCodec.Serialize(record.Result),
            ErrorMessage = record.ErrorMessage,
        };
}
