using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.CloudInventoryExtractor;

public sealed partial class CloudInventoryExtractorIngestService(
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
}
