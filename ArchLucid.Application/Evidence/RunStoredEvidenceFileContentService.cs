using System.Text;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Evidence;

public interface IRunStoredEvidenceFileContentService
{
    Task<RunStoredEvidenceFileContentResult?> GetContentAsync(
        Guid runId,
        string evidenceItemId,
        CancellationToken cancellationToken);
}

public sealed class RunStoredEvidenceFileContentService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IRunRepository runRepository,
    IRunStoredEvidenceFileRepository storedEvidenceFileRepository,
    IArtifactBlobStore blobStore,
    IAuditService auditService,
    ILogger<RunStoredEvidenceFileContentService> logger) : IRunStoredEvidenceFileContentService
{
    public async Task<RunStoredEvidenceFileContentResult?> GetContentAsync(
        Guid runId,
        string evidenceItemId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false) is null)
        {
            return null;
        }

        RunStoredEvidenceFileRecord? record =
            await storedEvidenceFileRepository.TryGetByEvidenceItemIdAsync(
                    scope,
                    runId,
                    evidenceItemId,
                    cancellationToken)
                .ConfigureAwait(false);

        if (record is null)
        {
            return null;
        }

        string? blobPayload = await blobStore.ReadAsync(record.BlobUri, cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(blobPayload))
        {
            return null;
        }

        byte[] bytes;

        try
        {
            bytes = Convert.FromBase64String(blobPayload.Trim());
        }
        catch (FormatException)
        {
            bytes = Encoding.UTF8.GetBytes(blobPayload);
        }

        string contentType = string.IsNullOrWhiteSpace(record.ContentType)
            ? "application/octet-stream"
            : record.ContentType.Trim();

        await AppendOpenedAuditEventAsync(scope, runId, record, cancellationToken).ConfigureAwait(false);

        return new RunStoredEvidenceFileContentResult
        {
            Bytes = bytes,
            ContentType = contentType,
            OriginalFileName = record.OriginalFileName,
        };
    }

    private async Task AppendOpenedAuditEventAsync(
        ScopeContext scope,
        Guid runId,
        RunStoredEvidenceFileRecord record,
        CancellationToken cancellationToken)
    {
        string actor = actorContext.GetActor();

        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.EvidenceSourceOpened,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    evidenceItemId = record.EvidenceItemId,
                    fileName = record.OriginalFileName,
                },
                AuditJsonSerializationOptions.Instance),
        };

        await DurableAuditLogRetry.TryLogAsync(
                ct => auditService.LogAsync(auditEvent, ct),
                logger,
                $"RunStoredEvidenceFileContent:{runId:N}:{record.EvidenceItemId}",
                cancellationToken,
                auditEventTypeForMetrics: auditEvent.EventType)
            .ConfigureAwait(false);
    }
}
