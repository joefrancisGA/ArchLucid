using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

public sealed partial class AzureExtractorIngestService(
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
}
