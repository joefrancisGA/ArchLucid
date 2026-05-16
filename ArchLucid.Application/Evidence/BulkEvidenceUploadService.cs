using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Evidence;

public sealed class BulkEvidenceUploadService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IRunRepository runRepository,
    IArtifactBlobStore blobStore,
    IOptions<EvidenceBulkUploadOptions> options,
    ILogger<BulkEvidenceUploadService> logger) : IBulkEvidenceUploadService
{
    // Mirrors ArchLucid.Host.Core.ProblemDetails.ProblemErrorCodes (Application must not reference Host.Core).
    private const string RunNotFoundCode = "RUN_NOT_FOUND";

    private const string InternalErrorCode = "INTERNAL_ERROR";

    private readonly BulkEvidenceUploadValidator _validator = new();

    public async Task<BulkEvidenceUploadResult> UploadBulkEvidenceAsync(
        Guid runId,
        IFormFileCollection files,
        CancellationToken cancellationToken,
        string? correlationId = null)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();

        // 1 & 2. Validate count BEFORE processing
        BulkEvidenceUploadValidationResult validationResult = _validator.ValidateBulkUpload(files.Count, options.Value.EvidenceBulkUploadMaxFiles);
        if (!validationResult.IsValid)
        {
            return new BulkEvidenceUploadResult
            {
                Succeeded = false,
                ErrorCode = validationResult.ErrorCode,
                FailureDetail = validationResult.ErrorMessage
            };
        }

        // Validate Run exists
        RunRecord? existingRun = await runRepository.GetByIdAsync(scope, runId, cancellationToken);
        if (existingRun is null)
        {
            return new BulkEvidenceUploadResult
            {
                Succeeded = false,
                ErrorCode = RunNotFoundCode,
                FailureDetail = $"Run '{runId:N}' was not found in the current scope."
            };
        }

        List<string> uploadedIds = [];
        List<string> fileNames = [];

        // 3 & 4. Process files with partial failure documentation
        // Note: Blob storage operations cannot be easily rolled back in a SQL transaction.
        // We attempt to upload all valid files; if an exception occurs mid-batch, 
        // the successfully uploaded blobs remain and partial failure is reported.
        try
        {
            foreach (IFormFile file in files)
            {
                // Basic per-file validation
                if (file.Length == 0)
                {
                    logger.LogWarning("Skipped empty file '{FileName}' during bulk upload for run {RunId}", LogSanitizer.Sanitize(file.FileName), runId);
                    continue;
                }

                string evidenceItemId = Guid.NewGuid().ToString("N");
                string blobName = $"evidence/{runId:N}/{evidenceItemId}_{Path.GetFileName(file.FileName)}";

                using Stream stream = file.OpenReadStream();
                using MemoryStream ms = new();
                await stream.CopyToAsync(ms, cancellationToken);
                string contentBase64 = Convert.ToBase64String(ms.ToArray());

                // Reuse existing blob store logic
                await blobStore.WriteAsync("artifacts", blobName, contentBase64, cancellationToken);

                uploadedIds.Add(evidenceItemId);
                fileNames.Add(file.FileName);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Partial failure during bulk evidence upload for RunId={RunId}. {Count} files were uploaded before failure.", runId, uploadedIds.Count);
            
            return new BulkEvidenceUploadResult
            {
                Succeeded = false,
                ErrorCode = InternalErrorCode,
                FailureDetail = $"An error occurred during upload. {uploadedIds.Count} of {files.Count} files were uploaded. Error: {ex.Message}",
                UploadedEvidenceItemIds = uploadedIds
            };
        }

        // 5. Emit audit event (bounded retry — transient SQL failures must not silently drop the row)
        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.EvidenceBulkAttached,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            CorrelationId = correlationId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    fileCount = uploadedIds.Count,
                    fileNames = fileNames
                },
                AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.TryLogAsync(
                ct => auditService.LogAsync(auditEvent, ct),
                logger,
                $"BulkEvidenceUpload:{runId:N}",
                cancellationToken,
                auditEventTypeForMetrics: auditEvent.EventType)
            .ConfigureAwait(false);

        return new BulkEvidenceUploadResult
        {
            Succeeded = true,
            UploadedEvidenceItemIds = uploadedIds
        };
    }
}
