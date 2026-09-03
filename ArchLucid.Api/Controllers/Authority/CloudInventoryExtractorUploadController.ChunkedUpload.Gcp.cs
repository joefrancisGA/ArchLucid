using System.Text.Json;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using static ArchLucid.Application.CloudInventoryExtractor.CloudInventoryExtractorUploadLimits;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class CloudInventoryExtractorUploadController
{
    /// <summary>Starts a chunked GCP inventory ingest session.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("gcp/upload-sessions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> BeginGcpChunkUploadAsync(
        [FromBody] AzureExtractorChunkUploadStartBody body,
        CancellationToken cancellationToken)
    {
        BeginChunkSessionResult beginResult =
            await TryBeginChunkSessionAsync(body, cancellationToken);

        if (beginResult.Failure is not null)
        {
            return beginResult.Failure;
        }

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageChunkSessionStarted,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = CloudProvider.Gcp.ToString(),
                        sessionId = beginResult.SessionId,
                        fileName = body!.FileName.Trim(),
                        body.TotalChunks,
                        totalBytes = body.TotalBytes,
                        maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return Ok(new { sessionId = beginResult.SessionId, maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes });
    }

    /// <summary>Uploads one zero-based chunk of a GCP inventory ZIP.</summary>
    [HttpPut("gcp/upload-sessions/{sessionId:guid}/chunks/{chunkIndex:int}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [RequestSizeLimit(ChunkUploadHttpEnvelopeBudgetBytes)]
    public Task<IActionResult> UploadGcpChunkAsync(
        Guid sessionId,
        int chunkIndex,
        CancellationToken cancellationToken)
        => UploadChunkAsync(sessionId, chunkIndex, cancellationToken);

    /// <summary>Assembles staged GCP inventory chunks and runs ingest.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("gcp/upload-sessions/{sessionId:guid}/complete")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public Task<IActionResult> CompleteGcpChunkUploadAsync(
        Guid sessionId,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
        => CompleteChunkUploadAsync(CloudProvider.Gcp, sessionId, runId, cancellationToken);
}
