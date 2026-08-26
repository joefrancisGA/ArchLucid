using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Finalization;

public sealed partial class ManifestFinalizationService
{
    private async Task<ManifestFinalizationResult> FinalizeSqlAsync(ScopeContext scope, ManifestFinalizationRequest request, IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        IDbConnection connection = uow.Connection;
        IDbTransaction transaction = uow.Transaction;
        ManifestFinalizationLockedRunRow? locked = await manifestFinalizationSqlRepository.LockRunForFinalizationAsync(
            scope,
            request.RunId,
            connection,
            transaction,
            cancellationToken);

        if (locked is null)
            throw new RunNotFoundException(request.RunId.ToString("N"));

        if (string.Equals(locked.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            if (locked.GoldenManifestId is not { } manifestId)
                throw new ConflictException($"Run '{request.RunId:D}' is Committed but GoldenManifestId is missing on the run record.");
            await uow.CommitAsync(cancellationToken);
            return new ManifestFinalizationResult(manifestId, true, locked.CurrentManifestVersion ?? string.Empty, null);
        }

        RunStateTransitionEnforcement.EnsureCommitAllowedLegacy(_runStateTransitionService, request.RunId, locked.LegacyRunStatus);

        if (request.ReadyForCommitHandle is ReadyForCommitRun readyHandle)
        {
            readyHandle.ValidateRunId(request.RunId);

            if (!ArchitectureRunStatusTransitionTable.TryParseStatus(locked.LegacyRunStatus, out ArchitectureRunStatus lockedStatus))
                throw new InvalidOperationException(
                    $"Run '{request.RunId:D}' has unparsable LegacyRunStatus '{locked.LegacyRunStatus}' during finalize.");

            readyHandle.ValidateLockedRunStatus(lockedStatus);
        }

        if (locked.FindingsSnapshotId is null || locked.FindingsSnapshotId.Value != request.ExpectedFindingsSnapshotId)
            throw new InvalidOperationException("Findings snapshot on the run record does not match the expected findings for finalization.");
        await EnsureFindingsSnapshotFinalizableAsync(request.ExpectedFindingsSnapshotId, request.PreloadedFindingsSnapshot, cancellationToken);

        if (request.ExpectedArtifactBundleId is { } expectedBundle)
        {
            if (locked.ArtifactBundleId is null || locked.ArtifactBundleId.Value != expectedBundle)
                throw new InvalidOperationException("Artifact bundle on the run record does not match the expected bundle for finalization.");
        }

        RuleAuditTracePayload audit = request.Trace.RequireRuleAudit();
        ManifestDocument persisted = await PersistPipelineArtifactsForFinalizationAsync(
            scope,
            request,
            cancellationToken,
            connection,
            transaction);
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        Guid auditEventId = Guid.NewGuid();
        Guid outboxId = Guid.NewGuid();
        string auditDataJson = JsonSerializer.Serialize(
            new
            {
                manifestVersion = request.Contract.Metadata.ManifestVersion,
                findingsSnapshotId = request.ExpectedFindingsSnapshotId,
                artifactBundleId = request.ExpectedArtifactBundleId,
                decisionTraceId = audit.DecisionTraceId,
                manifestId = persisted.ManifestId
            }, IntegrationEventJson.Options);
        object outboxPayload = new
        {
            schemaVersion = 1,
            runId = request.RunId,
            manifestId = persisted.ManifestId,
            decisionTraceId = audit.DecisionTraceId,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            findingsSnapshotId = request.ExpectedFindingsSnapshotId,
            artifactBundleId = request.ExpectedArtifactBundleId,
            manifestVersion = request.Contract.Metadata.ManifestVersion
        };
        byte[] payloadUtf8 = JsonSerializer.SerializeToUtf8Bytes(outboxPayload, IntegrationEventJson.Options);
        string messageId = $"{request.RunId:N}:{IntegrationEventTypes.ManifestFinalizedV1}";
        ManifestFinalizationProcedureRequest procedureRequest = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = request.RunId,
            ExpectedFindingsSnapshotId = request.ExpectedFindingsSnapshotId,
            ExpectedArtifactBundleId = request.ExpectedArtifactBundleId,
            ManifestId = persisted.ManifestId,
            DecisionTraceId = audit.DecisionTraceId,
            ManifestVersion = request.Contract.Metadata.ManifestVersion,
            ExpectedRowVersion = locked.RowVersionStamp,
            ActorUserId = request.ActorUserId,
            ActorUserName = request.ActorUserName,
            AuditEventId = auditEventId,
            OccurredUtc = occurredUtc,
            AuditDataJson = auditDataJson,
            CorrelationId = request.CorrelationId,
            OutboxId = outboxId,
            IntegrationEventType = IntegrationEventTypes.ManifestFinalizedV1,
            OutboxMessageId = messageId,
            OutboxPayloadUtf8 = payloadUtf8,
            OutboxPriority = IntegrationEventOutboxPriority.ForEventType(IntegrationEventTypes.ManifestFinalizedV1)
        };

        try
        {
            await manifestFinalizationSqlRepository.ExecuteFinalizeProcedureAsync(
                procedureRequest,
                connection,
                transaction,
                cancellationToken);
        }
        catch (ManifestFinalizationFaultException ex)
        {
            throw ManifestFinalizationFaultMapper.ToApplicationException(ex);
        }

        IReadOnlyList<Guid> supersededManifestIds =
            await goldenManifestRepository.SupersedeUnreferencedActiveGoldenManifestsAsync(scope, persisted.ManifestId, connection, transaction,
                cancellationToken);

        await uow.CommitAsync(cancellationToken);

        await EmitManifestSupersededAuditsAsync(scope, request, supersededManifestIds, persisted.ManifestId, cancellationToken);

        return new ManifestFinalizationResult(persisted.ManifestId, false, request.Contract.Metadata.ManifestVersion, persisted);
    }
}
