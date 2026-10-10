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

    public async Task<AdvisoryDraftOperationCreateResult> CreatePendingAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        Guid operationId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        AdvisoryDraftOperationRow row = BuildRow(scope, operationId, now);
        bool inserted = await _repository.TryInsertPendingAsync(row, cancellationToken);

        if (!inserted)
        {
            AdvisoryDraftOperationRow? existing = await _repository.GetAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    operationId,
                    cancellationToken)
                ?? throw new InvalidOperationException("Failed to register advisory draft operation.");

            return new AdvisoryDraftOperationCreateResult(MapToRecord(scope, existing), Created: false);
        }

        return new AdvisoryDraftOperationCreateResult(MapToRecord(scope, row), Created: true);
    }

    public async Task<AdvisoryDraftOperationRecord?> GetAsync(
        string operationId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        if (!TryParseDraftOperationId(operationId, out Guid parsedId))
        {
            return null;
        }

        AdvisoryDraftOperationRow? row = await _repository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            parsedId,
            cancellationToken);

        if (row is null)
        {
            return null;
        }

        return MapToRecord(scope, row);
    }

    public Task MarkRunningAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default) =>
        UpdateRecordAsync(scope, operationId, static record =>
        {
            record.State = OperationState.Running;
            record.StepLabel = AdvisoryDraftOperationSteps.ReadingOverview;
            record.CurrentStep = 1;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        }, cancellationToken);

    public Task UpdateProgressAsync(
        ScopeContext scope,
        string operationId,
        string stepLabel,
        int currentStep,
        CancellationToken cancellationToken = default) =>
        UpdateRecordAsync(scope, operationId, record =>
        {
            record.StepLabel = stepLabel;
            record.CurrentStep = currentStep;
            record.HeartbeatUtc = TimeProvider.System.GetUtcNow();
        }, cancellationToken);

    public Task MarkSucceededAsync(
        ScopeContext scope,
        string operationId,
        DraftArchitectureRequestResponse result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(result);

        return UpdateRecordAsync(scope, operationId, record =>
        {
            record.State = OperationState.Succeeded;
            record.StepLabel = AdvisoryDraftOperationSteps.Complete;
            record.CurrentStep = AdvisoryDraftOperationSteps.TotalSteps;
            record.Result = result;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        }, cancellationToken);
    }

    public Task MarkFailedAsync(
        ScopeContext scope,
        string operationId,
        string errorMessage,
        CancellationToken cancellationToken = default) =>
        UpdateRecordAsync(scope, operationId, record =>
        {
            record.State = OperationState.Failed;
            record.StepLabel = AdvisoryDraftOperationSteps.Failed;
            record.ErrorMessage = errorMessage;
            record.CompletedUtc = TimeProvider.System.GetUtcNow();
            record.HeartbeatUtc = record.CompletedUtc.Value;
        }, cancellationToken);

    public Task MarkCanceledAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default) =>
        UpdateRecordAsync(scope, operationId, record =>
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

    private async Task UpdateRecordAsync(
        ScopeContext scope,
        string operationId,
        Action<AdvisoryDraftOperationRecord> mutate,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!TryParseDraftOperationId(operationId, out Guid parsedId))
        {
            return;
        }

        AdvisoryDraftOperationRow? row = await _repository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            parsedId,
            cancellationToken);

        if (row is null)
        {
            return;
        }

        AdvisoryDraftOperationRecord record = MapToRecord(scope, row);
        mutate(record);
        await _repository.UpdateAsync(MapToRow(record), cancellationToken);
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
