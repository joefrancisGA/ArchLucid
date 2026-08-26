using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.CloudInventoryExtractor;

public sealed partial class CloudInventoryExtractorIngestService
{
    private async Task<CloudInventoryExtractorIngestResult> FailAsync(
        string eventType,
        string detail,
        bool schemaRejection,
        bool invalidArchive,
        CloudProvider cloudProvider,
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
                        cloudProvider = cloudProvider.ToString(),
                        reason = detail,
                        uploadedFileName,
                        uploadedBytes,
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        return new CloudInventoryExtractorIngestResult
        {
            Succeeded = false,
            FailureDetail = detail,
            IsSchemaRejection = schemaRejection,
            IsInvalidArchive = invalidArchive,
        };
    }

    private async Task<CloudInventoryExtractorIngestResult?> TryRejectInvalidManifestBeforeBufferAsync(
        IFormFile file,
        CloudProvider cloudProvider,
        string actor,
        ScopeContext scope,
        string? correlationId,
        string safeName,
        CancellationToken ct)
    {
        await using Stream uploadStream = file.OpenReadStream();

        CloudInventoryExtractorZipValidationResult zipValidation =
            CloudInventoryExtractorPackageZipValidator.Validate(uploadStream);

        if (zipValidation.IsValid)
            return null;

        string eventType = zipValidation.IsSchemaRejection
            ? AuditEventTypes.CloudInventoryExtractorPackageSchemaRejected
            : AuditEventTypes.CloudInventoryExtractorPackageParseFailed;

        return await FailAsync(
            eventType,
            zipValidation.ErrorDetail ?? "Invalid cloud inventory extractor ZIP.",
            schemaRejection: zipValidation.IsSchemaRejection,
            invalidArchive: zipValidation.IsInvalidArchive,
            cloudProvider,
            actor,
            scope,
            correlationId,
            safeName,
            uploadedBytes: null,
            ct);
    }
}
