using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.CloudInventoryExtractor;

public sealed class CloudInventoryExtractorIngestService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    ICloudInventoryExtractorPackageRepository packageRepository,
    IRunRepository runRepository,
    ILogger<CloudInventoryExtractorIngestService> logger) : ICloudInventoryExtractorIngestService
{
    internal const long MaxUploadedZipBytes = CloudInventoryExtractorUploadLimits.MaxZipBytes;

    public async Task<CloudInventoryExtractorIngestResult> IngestZipAsync(
        CloudProvider cloudProvider,
        IFormFile? file,
        Guid? runId,
        CancellationToken ct,
        string? correlationId = null)
    {
        ct.ThrowIfCancellationRequested();

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            throw new ArgumentOutOfRangeException(
                nameof(cloudProvider),
                cloudProvider,
                "Only Aws and Gcp inventory uploads are supported.");
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        string actor = actorContext.GetActor();

        if (file is null)
        {
            return await FailAsync(
                AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                "No file uploaded (expected form field 'file').",
                schemaRejection: false,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                uploadedFileName: null,
                uploadedBytes: null,
                ct);
        }

        string safeName = NormalizeZipFileName(file.FileName);

        if (file.Length > MaxUploadedZipBytes)
        {
            return await FailAsync(
                AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                $"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.",
                schemaRejection: false,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                safeName,
                null,
                ct);
        }

        CloudInventoryExtractorIngestResult? earlyManifestRejection =
            await TryRejectInvalidManifestBeforeBufferAsync(file, cloudProvider, actor, scope, correlationId, safeName, ct);

        if (earlyManifestRejection is not null)
            return earlyManifestRejection;

        byte[] zipBytes;

        try
        {
            zipBytes = await ReadCappedZipAsync(file, ct);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Cloud inventory extractor upload read failed for {CloudProvider}.", cloudProvider);

            return await FailAsync(
                AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                ex.Message,
                schemaRejection: false,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                safeName,
                null,
                ct);
        }

        return await IngestPreparedZipAsync(zipBytes, safeName, cloudProvider, runId, correlationId, MaxUploadedZipBytes, ct);
    }

    public Task<CloudInventoryExtractorIngestResult> IngestZipBytesAsync(
        CloudProvider cloudProvider,
        byte[] zipBytes,
        string originalFileName,
        Guid? runId,
        CancellationToken ct,
        string? correlationId = null,
        long? maxAcceptedZipBytes = null)
    {
        ct.ThrowIfCancellationRequested();

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            throw new ArgumentOutOfRangeException(
                nameof(cloudProvider),
                cloudProvider,
                "Only Aws and Gcp inventory uploads are supported.");
        }

        ArgumentNullException.ThrowIfNull(zipBytes);

        string safeName = NormalizeZipFileName(originalFileName);
        long cap = maxAcceptedZipBytes ?? MaxUploadedZipBytes;

        return IngestPreparedZipAsync(zipBytes, safeName, cloudProvider, runId, correlationId, cap, ct);
    }

    private async Task<CloudInventoryExtractorIngestResult> IngestPreparedZipAsync(
        byte[] zipBytes,
        string safeName,
        CloudProvider cloudProvider,
        Guid? runId,
        string? correlationId,
        long maxAcceptedZipBytes,
        CancellationToken ct)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        string actor = actorContext.GetActor();

        using Activity? uploadActivity =
            ArchLucidInstrumentation.CloudInventoryExtractorUpload.StartActivity("cloud_inventory_extractor.upload.ingest");

        uploadActivity?.SetTag("archlucid.cloud_inventory_extractor.provider", cloudProvider.ToString());
        uploadActivity?.SetTag("archlucid.cloud_inventory_extractor.file_size_bytes", zipBytes.LongLength);

        using MemoryStream validationStream = new(zipBytes, writable: false);

        CloudInventoryExtractorZipValidationResult zipValidation =
            CloudInventoryExtractorPackageZipValidator.Validate(validationStream);

        if (!zipValidation.IsValid)
        {
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
                zipBytes.LongLength,
                ct);
        }

        uploadActivity?.SetTag("archlucid.cloud_inventory_extractor.file_entry_count", zipValidation.FileEntryCount);

        if (zipBytes.LongLength > maxAcceptedZipBytes)
        {
            return await FailAsync(
                AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                $"ZIP exceeds maximum size of {maxAcceptedZipBytes} bytes.",
                schemaRejection: false,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageUploaded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = cloudProvider.ToString(),
                        originalFileName = safeName,
                        sizeBytes = zipBytes.LongLength,
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        using MemoryStream zipStream = new(zipBytes);

        (CloudInventoryExtractorNormalizedManifest? manifest, string? manifestError) =
            CloudInventoryExtractorManifestReader.TryReadNormalizedFromZip(zipStream, cloudProvider);

        if (manifestError is not null)
        {
            bool schemaReject = manifestError.StartsWith(
                                     "Unsupported manifest schemaVersion",
                                     StringComparison.Ordinal)
                                 || manifestError.Contains("schemaVersion", StringComparison.Ordinal)
                                 || manifestError.Contains("manifest.json", StringComparison.Ordinal)
                                 || manifestError.Contains("cloudProvider", StringComparison.Ordinal);

            string eventType = schemaReject
                ? AuditEventTypes.CloudInventoryExtractorPackageSchemaRejected
                : AuditEventTypes.CloudInventoryExtractorPackageParseFailed;

            return await FailAsync(
                eventType,
                manifestError,
                schemaRejection: schemaReject,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);
        }

        if (manifest is null)
        {
            return await FailAsync(
                AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                "manifest.json could not be loaded.",
                schemaRejection: true,
                invalidArchive: false,
                cloudProvider,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);
        }

        if (runId is { } runGuid)
        {
            RunRecord? existing = await runRepository.GetByIdAsync(scope, runGuid, ct);

            if (existing is null)
            {
                return await FailAsync(
                    AuditEventTypes.CloudInventoryExtractorPackageParseFailed,
                    "Run id is not recognized in this workspace scope.",
                    schemaRejection: false,
                    invalidArchive: false,
                    cloudProvider,
                    actor,
                    scope,
                    correlationId,
                    safeName,
                    zipBytes.LongLength,
                    ct);
            }
        }

        Guid packageId = Guid.NewGuid();

        ActivityScopeTags.ApplyEvidencePackageId(Activity.Current, packageId);

        CloudInventoryExtractorPackageRecord record = new()
        {
            PackageId = packageId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CloudProvider = cloudProvider,
            SchemaVersion = manifest.SchemaVersion,
            ScriptVersion = manifest.ScriptVersion,
            CollectionTimestampUtc = manifest.CollectionTimestamp.UtcDateTime,
            ScopeId = manifest.ScopeId,
            OriginalFileName = safeName,
            ManifestJson = manifest.RawJson,
            PackageBytes = zipBytes,
        };

        await packageRepository.InsertAsync(record, ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageIngestSucceeded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = cloudProvider.ToString(),
                        packageId,
                        citation = CloudInventoryExtractorCitationFormatter.FormatCostProofPoint(manifest),
                        manifest.SchemaVersion,
                        scopeId = manifest.ScopeId,
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        return new CloudInventoryExtractorIngestResult
        {
            Succeeded = true,
            PackageId = packageId,
            IsSchemaRejection = false,
        };
    }

    private static string NormalizeZipFileName(string? fileName)
    {
        string safeName = string.IsNullOrWhiteSpace(fileName)
            ? "package.zip"
            : Path.GetFileName(fileName.Trim());

        if (safeName.Length > 400)
            safeName = safeName[..400];

        if (!string.Equals(Path.GetExtension(safeName), ".zip", StringComparison.OrdinalIgnoreCase))
            safeName += ".zip";

        return safeName;
    }

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

    private static async Task<byte[]> ReadCappedZipAsync(IFormFile file, CancellationToken ct)
    {
        await using Stream stream = file.OpenReadStream();

        using MemoryStream ms = new((int)Math.Min(file.Length, MaxUploadedZipBytes));

        byte[] buffer = new byte[8192];

        long total = 0;

        while (true)
        {
            int read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);

            if (read == 0)
                break;

            total += read;

            if (total > MaxUploadedZipBytes)
            {
                throw new InvalidOperationException(
                    $"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.");
            }

            ms.Write(buffer, 0, read);
        }

        return ms.ToArray();
    }
}
