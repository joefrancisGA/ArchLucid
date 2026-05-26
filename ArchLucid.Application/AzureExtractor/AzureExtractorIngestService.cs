using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;
using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

public sealed class AzureExtractorIngestService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IAzureExtractorPackageRepository packageRepository,
    IRunRepository runRepository,
    IAgentTaskRepository agentTaskRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    IAzureExtractorResultEnricher inventoryEnricher,
    IOptions<AzureExtractorEnrichmentOptions> enrichmentOptions,
    ILogger<AzureExtractorIngestService> logger) : IAzureExtractorIngestService
{
    internal const long MaxUploadedZipBytes = AzureExtractorUploadLimits.MaxZipBytes;

    public async Task<AzureExtractorIngestResult> IngestZipAsync(
        IFormFile? file,
        Guid? runId,
        CancellationToken ct,
        string? correlationId = null)
    {
        ct.ThrowIfCancellationRequested();

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        string actor = actorContext.GetActor();

        if (file is null)
            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,
                "No file uploaded (expected form field 'file').",
                schemaRejection: false,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                uploadedFileName: null,
                uploadedBytes: null,
                ct);

        string safeName = NormalizeZipFileName(file.FileName);

        if (file.Length > MaxUploadedZipBytes)

            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,
                $"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.",
                schemaRejection: false,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                safeName,
                null,
                ct);

        AzureExtractorIngestResult? earlyManifestRejection =
            await TryRejectInvalidManifestBeforeBufferAsync(file, actor, scope, correlationId, safeName, ct);

        if (earlyManifestRejection is not null)
            return earlyManifestRejection;

        byte[] zipBytes;

        try
        {
            zipBytes = await ReadCappedZipAsync(file, ct);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Azure extractor upload read failed.");

            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,
                ex.Message,
                schemaRejection: false,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                safeName,
                null,
                ct);
        }

        return await IngestPreparedZipAsync(zipBytes, safeName, runId, correlationId, MaxUploadedZipBytes, ct);
    }

    public async Task<AzureExtractorIngestResult> IngestZipBytesAsync(
        byte[] zipBytes,
        string originalFileName,
        Guid? runId,
        CancellationToken ct,
        string? correlationId,
        long maxAcceptedZipBytes)
    {
        ct.ThrowIfCancellationRequested();

        ArgumentNullException.ThrowIfNull(zipBytes);

        string safeName = NormalizeZipFileName(originalFileName);

        return await IngestPreparedZipAsync(zipBytes, safeName, runId, correlationId, maxAcceptedZipBytes, ct);
    }

    private async Task<AzureExtractorIngestResult> IngestPreparedZipAsync(
        byte[] zipBytes,
        string safeName,
        Guid? runId,
        string? correlationId,
        long maxAcceptedZipBytes,
        CancellationToken ct)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        string actor = actorContext.GetActor();

        using Activity? uploadActivity =
            ArchLucidInstrumentation.AzureExtractorUpload.StartActivity("azure_extractor.upload.ingest");

        uploadActivity?.SetTag("archlucid.azure_extractor.file_size_bytes", zipBytes.LongLength);

        using MemoryStream validationStream = new(zipBytes, writable: false);

        AzureExtractorZipValidationResult zipValidation = AzureExtractorPackageZipValidator.Validate(validationStream);

        if (!zipValidation.IsValid)
        {
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
                zipBytes.LongLength,
                ct);
        }

        uploadActivity?.SetTag("archlucid.azure_extractor.file_entry_count", zipValidation.FileEntryCount);

        if (zipBytes.LongLength > maxAcceptedZipBytes)

            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,
                $"ZIP exceeds maximum size of {maxAcceptedZipBytes} bytes.",
                schemaRejection: false,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AzureExtractorPackageUploaded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        originalFileName = safeName,
                        sizeBytes = zipBytes.LongLength
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        using MemoryStream zipStream = new(zipBytes);

        (AzureExtractorNormalizedManifest? manifest, string? manifestError) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(zipStream);

        if (manifestError is not null)
        {
            bool schemaReject = manifestError.StartsWith(
                                     "Unsupported manifest schemaVersion",
                                     StringComparison.Ordinal)
                                 || manifestError.Contains("schemaVersion", StringComparison.Ordinal)
                                 || manifestError.Contains("manifest.json", StringComparison.Ordinal);

            string eventType = schemaReject
                ? AuditEventTypes.AzureExtractorPackageSchemaRejected
                : AuditEventTypes.AzureExtractorPackageParseFailed;

            return await FailAsync(
                eventType,
                manifestError,
                schemaRejection: schemaReject,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);
        }

        if (manifest is null)
            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,
                "manifest.json could not be loaded.",
                schemaRejection: true,
                invalidArchive: false,
                actor,
                scope,
                correlationId,
                safeName,
                zipBytes.LongLength,
                ct);

        zipBytes = await TryEnrichPackageInventoryAsync(zipBytes, ct).ConfigureAwait(false);

        if (runId is { } runGuid)
        {
            RunRecord? existing = await runRepository.GetByIdAsync(scope, runGuid, ct);

            if (existing is null)

                return await FailAsync(
                    AuditEventTypes.AzureExtractorPackageParseFailed,
                    "Run id is not recognized in this workspace scope.",
                    schemaRejection: false,
                    invalidArchive: false,
                    actor,
                    scope,
                    correlationId,
                    safeName,
                    zipBytes.LongLength,
                    ct);
        }

        Guid packageId = Guid.NewGuid();

        AzureExtractorPackageRecord record = new()
        {
            PackageId = packageId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            SchemaVersion = manifest.SchemaVersion,
            ScriptVersion = manifest.ScriptVersion,
            CollectionTimestampUtc = manifest.CollectionTimestamp.UtcDateTime,
            SubscriptionId = manifest.SubscriptionId,
            OriginalFileName = safeName,
            ManifestJson = manifest.RawJson,
            PackageBytes = zipBytes,
        };

        await packageRepository.InsertAsync(record, ct);

        if (runId is { } mergedRunGuid)
        {
            try
            {
                await TryAttachEvidenceBundleAsync(mergedRunGuid, record, ct);
            }

            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(
                    ex,
                    "Azure extractor ingest succeeded but evidence bundle attachment failed for RunId={RunId:N}.",
                    mergedRunGuid);
            }
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AzureExtractorPackageIngestSucceeded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        packageId,
                        citation = AzureExtractorCitationFormatter.FormatCostProofPoint(manifest),
                        manifest.SchemaVersion,
                        manifest.SubscriptionId,
                    },
                    AuditJsonSerializationOptions.Instance),
                CorrelationId = correlationId,
            },
            ct);

        return new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId, IsSchemaRejection = false };
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

    private async Task TryAttachEvidenceBundleAsync(Guid runGuid, AzureExtractorPackageRecord record, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(record);

        IReadOnlyList<AgentTask> tasks = await agentTaskRepository.GetByRunIdAsync(runGuid.ToString("N"), ct);

        string? bundleRef = (from task in tasks where !string.IsNullOrWhiteSpace(task.EvidenceBundleRef) select task.EvidenceBundleRef!.Trim())
            .FirstOrDefault();

        if (string.IsNullOrWhiteSpace(bundleRef))
            return;

        EvidenceBundle? bundle = await evidenceBundleRepository.GetByIdAsync(bundleRef, ct);

        if (bundle is null)
            return;

        AzureExtractorPackageProvenance provenance = AzureExtractorPackageProvenance.FromRecord(record);

        AzureExtractorEvidenceBundleMerger.Merge(bundle, provenance);

        await evidenceBundleRepository.UpdateAsync(bundle, ct);
    }

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

                throw new InvalidOperationException(
                    $"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.");

            ms.Write(buffer, 0, read);
        }

        return ms.ToArray();
    }

    private async Task<byte[]> TryEnrichPackageInventoryAsync(byte[] zipBytes, CancellationToken ct)
    {
        if (!enrichmentOptions.Value.Enabled)
            return zipBytes;

        IReadOnlyList<AzureExtractorInventoryResourceLine> lines = AzureExtractorInventoryZipPatcher.ReadLines(zipBytes);

        if (lines.Count == 0)
            return zipBytes;

        IReadOnlyList<EnrichedAzureExtractorInventoryLine> enriched =
            await inventoryEnricher.EnrichAsync(lines, ct).ConfigureAwait(false);

        return AzureExtractorInventoryZipPatcher.TryPatchResourcesJson(zipBytes, enriched);
    }
}
