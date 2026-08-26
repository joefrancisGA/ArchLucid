using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.AzureExtractor;

public sealed partial class AzureExtractorIngestService
{
    private async Task<AzureExtractorIngestResult> FailAsync(
        string eventType,
        string detail,
        bool schemaRejection,
        bool invalidArchive,
        string actor,
        ScopeContext scope,
        string? correlationId,
        string? uploadedFileName,
        long? uploadedBytes,
        CancellationToken ct)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        reason = detail,
                        uploadedFileName,
                        uploadedBytes
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        return new AzureExtractorIngestResult
        {
            Succeeded = false,
            FailureDetail = detail,
            IsSchemaRejection = schemaRejection,
            IsInvalidArchive = invalidArchive,
        };
    }

    /// <summary>
    ///     Validates <c>manifest.json</c> schema from the upload stream before buffering the full ZIP payload.
    ///     Rejects poison-pill archives early without allocating the capped byte buffer used for persistence.
    /// </summary>
    private async Task<AzureExtractorIngestResult?> TryRejectInvalidManifestBeforeBufferAsync(
        IFormFile file,
        string actor,
        ScopeContext scope,
        string? correlationId,
        string safeName,
        CancellationToken ct)
    {
        await using Stream uploadStream = file.OpenReadStream();

        AzureExtractorZipValidationResult zipValidation = AzureExtractorPackageZipValidator.Validate(uploadStream);

        if (zipValidation.IsValid)
            return null;

        string eventType = zipValidation.IsSchemaRejection
            ? AuditEventTypes.AzureExtractorPackageSchemaRejected
            : AuditEventTypes.AzureExtractorPackageParseFailed;

        return await FailAsync(
            eventType,
            zipValidation.ErrorDetail ?? "Invalid Azure extractor ZIP.",
            schemaRejection: zipValidation.IsSchemaRejection,
            invalidArchive: zipValidation.IsInvalidArchive,
            actor,
            scope,
            correlationId,
            safeName,
            uploadedBytes: null,
            ct);
    }
}
