using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

public sealed class OperatorInferredConnectionService(
    IOperatorInferredConnectionRepository connectionRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IInferenceQuestionnaireItemGenerator questionnaireItemGenerator,
    IAuditService auditService,
    ILogger<OperatorInferredConnectionService> logger) : IOperatorInferredConnectionService
{
    public async Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        // Upload proposals must list even when questionnaire generate/upsert fails.
        IReadOnlyList<OperatorInferredConnectionRecord>? existing =
            await TryListExistingInScopeAsync(scope, snapshotId, cancellationToken);

        return existing ?? [];
    }

    public async Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListQuestionnaireBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperatorInferredConnectionRecord>? existing =
            await TryListExistingInScopeAsync(scope, snapshotId, cancellationToken);

        if (existing is null)
        {
            return [];
        }

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return QuestionnaireRows(existing);
        }

        try
        {
            IReadOnlyList<OperatorInferredConnectionRecord> generated =
                await questionnaireItemGenerator.GenerateAndPersistAsync(
                    scope,
                    snapshot,
                    existing,
                    cancellationToken);

            if (generated.Count == 0)
            {
                return QuestionnaireRows(existing);
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(
                exception,
                "Failed to generate inference questionnaire items for snapshot {SnapshotId} in tenant {TenantId}.",
                snapshotId,
                scope.TenantId);
            throw;
        }

        IReadOnlyList<OperatorInferredConnectionRecord> refreshed =
            await connectionRepository.ListBySnapshotAsync(scope.TenantId, snapshotId, cancellationToken);

        return QuestionnaireRows(refreshed);
    }

    public async Task<OperatorInferredConnectionMutationResult> ConfirmAsync(
        ScopeContext scope,
        Guid snapshotId,
        OperatorInferredConnectionConfirmRequest request,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (request.ConnectionId == Guid.Empty)
        {
            return Failed("ConnectionId is required.");
        }

        OperatorInferredConnectionRecord? record =
            await connectionRepository.TryGetByIdInScopeAsync(
                scope.ToProjectScopeKey(),
                request.ConnectionId,
                cancellationToken);

        if (record is null || record.SnapshotId != snapshotId)
        {
            return Failed("Inferred connection was not found.");
        }

        if (record.Status == OperatorInferredConnectionStatus.Dismissed)
        {
            return Failed("Dismissed inferred connections cannot be confirmed.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        OperatorInferredConnectionRecord updated = new()
        {
            ConnectionId = record.ConnectionId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ProjectId,
            SnapshotId = record.SnapshotId,
            Status = OperatorInferredConnectionStatus.Confirmed,
            Source = record.Source,
            RuleName = record.RuleName,
            QuestionText = record.QuestionText,
            FromArmId = record.FromArmId,
            FromLabel = record.FromLabel,
            FromCloudResourceId = request.FromCloudResourceId ?? record.FromCloudResourceId,
            ToHost = record.ToHost,
            ToCatalog = request.ToCatalog ?? record.ToCatalog,
            ToArmId = request.ToArmId ?? record.ToArmId,
            ToCloudResourceId = request.ToCloudResourceId ?? record.ToCloudResourceId,
            SettingName = record.SettingName,
            SourceFileFormat = record.SourceFileFormat,
            ActorKey = actorKey,
            ProposalPayloadHashSha256 = record.ProposalPayloadHashSha256,
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = utcNow,
        };

        await connectionRepository.UpdateStatusInScopeAsync(scope.ToProjectScopeKey(), updated, cancellationToken);
        await LogAuditAsync(scope, actorKey, AuditEventTypes.OperatorInferredConnectionConfirmed, updated, cancellationToken);

        return new OperatorInferredConnectionMutationResult { Succeeded = true };
    }

    public async Task<OperatorInferredConnectionMutationResult> DismissAsync(
        ScopeContext scope,
        Guid snapshotId,
        OperatorInferredConnectionDismissRequest request,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (request.ConnectionId == Guid.Empty)
        {
            return Failed("ConnectionId is required.");
        }

        OperatorInferredConnectionRecord? record =
            await connectionRepository.TryGetByIdInScopeAsync(
                scope.ToProjectScopeKey(),
                request.ConnectionId,
                cancellationToken);

        if (record is null || record.SnapshotId != snapshotId)
        {
            return Failed("Inferred connection was not found.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        OperatorInferredConnectionRecord updated = new()
        {
            ConnectionId = record.ConnectionId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ProjectId,
            SnapshotId = record.SnapshotId,
            Status = OperatorInferredConnectionStatus.Dismissed,
            Source = record.Source,
            RuleName = record.RuleName,
            QuestionText = record.QuestionText,
            FromArmId = record.FromArmId,
            FromLabel = record.FromLabel,
            FromCloudResourceId = record.FromCloudResourceId,
            ToHost = record.ToHost,
            ToCatalog = record.ToCatalog,
            ToArmId = record.ToArmId,
            ToCloudResourceId = record.ToCloudResourceId,
            SettingName = record.SettingName,
            SourceFileFormat = record.SourceFileFormat,
            ActorKey = actorKey,
            ProposalPayloadHashSha256 = record.ProposalPayloadHashSha256,
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = utcNow,
        };

        await connectionRepository.UpdateStatusInScopeAsync(scope.ToProjectScopeKey(), updated, cancellationToken);
        await LogAuditAsync(scope, actorKey, AuditEventTypes.OperatorInferredConnectionDismissed, updated, cancellationToken);

        return new OperatorInferredConnectionMutationResult { Succeeded = true };
    }

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorKey,
        string eventType,
        OperatorInferredConnectionRecord record,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actorKey,
                ActorUserName = actorKey,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        record.ConnectionId,
                        record.SnapshotId,
                        record.Source,
                        record.Status,
                        record.FromArmId,
                        record.ToHost,
                        record.ToCatalog,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }

    private async Task<IReadOnlyList<OperatorInferredConnectionRecord>?> TryListExistingInScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return null;
        }

        AzureInventorySnapshotRecord? header =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null || header.TenantId != scope.TenantId)
        {
            return null;
        }

        IReadOnlyList<OperatorInferredConnectionRecord> existing =
            await connectionRepository.ListBySnapshotAsync(scope.TenantId, snapshotId, cancellationToken);

        return existing ?? [];
    }

    private static IReadOnlyList<OperatorInferredConnectionRecord> QuestionnaireRows(
        IReadOnlyList<OperatorInferredConnectionRecord> records) =>
        records
            .Where(record => record.Source == OperatorInferredConnectionSource.Questionnaire)
            .ToList();

    private static OperatorInferredConnectionMutationResult Failed(string message) =>
        new() { Succeeded = false, ErrorMessage = message };
}
