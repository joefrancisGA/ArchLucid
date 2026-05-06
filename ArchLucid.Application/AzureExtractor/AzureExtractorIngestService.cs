using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.AzureExtractor;

public sealed class AzureExtractorIngestService(
    IScopeContextProvider scopeContextProvider,

    IActorContext actorContext,

    IAuditService auditService,

    IAzureExtractorPackageRepository packageRepository,

    IRunRepository runRepository,

    IAgentTaskRepository agentTaskRepository,

    IEvidenceBundleRepository evidenceBundleRepository,

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

                actor,

                scope,

                correlationId,

                uploadedFileName: null,

                uploadedBytes: null,

                ct);

        string safeName = string.IsNullOrWhiteSpace(file.FileName)

            ? "package.zip"

            : Path.GetFileName(file.FileName.Trim());

        if (safeName.Length > 400)

            safeName = safeName[..400];

        if (!string.Equals(Path.GetExtension(safeName), ".zip", StringComparison.OrdinalIgnoreCase))

            safeName += ".zip";

        if (file.Length > MaxUploadedZipBytes)

            return await FailAsync(
                AuditEventTypes.AzureExtractorPackageParseFailed,

                $"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.",

                schemaRejection: false,

                actor,

                scope,

                correlationId,

                safeName,

                null,

                ct);

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

                actor,

                scope,

                correlationId,

                safeName,

                null,

                ct);
        }

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
                    new { originalFileName = safeName, sizeBytes = zipBytes.LongLength },

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
                StringComparison.Ordinal);

            string eventType = schemaReject

                ? AuditEventTypes.AzureExtractorPackageSchemaRejected

                : AuditEventTypes.AzureExtractorPackageParseFailed;

            return await FailAsync(
                eventType,

                manifestError,

                schemaRejection: schemaReject,

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

                schemaRejection: false,

                actor,

                scope,

                correlationId,

                safeName,

                zipBytes.LongLength,

                ct);

        Guid? persistedRunKey = runId;

        if (persistedRunKey is Guid runGuid)

        {

            RunRecord? existing = await runRepository.GetByIdAsync(scope, runGuid, ct);

            if (existing is null)

                return await FailAsync(
                    AuditEventTypes.AzureExtractorPackageParseFailed,

                    "Run id is not recognized in this workspace scope.",

                    schemaRejection: false,

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

            RunId = persistedRunKey,

            CreatedUtc = DateTime.UtcNow,

            SchemaVersion = manifest.SchemaVersion,

            ScriptVersion = manifest.ScriptVersion,

            CollectionTimestampUtc = manifest.CollectionTimestamp.UtcDateTime,

            SubscriptionId = manifest.SubscriptionId,

            OriginalFileName = safeName,

            ManifestJson = manifest.RawJson,

            PackageBytes = zipBytes,

        };

        await packageRepository.InsertAsync(record, ct);

        if (persistedRunKey is Guid mergedRunGuid)
        {

            try

            {

                await TryAttachEvidenceBundleAsync(mergedRunGuid, record, ct);

            }

            catch (Exception ex)when (ex is not OperationCanceledException)

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

                RunId = persistedRunKey,

                DataJson = JsonSerializer.Serialize(
                    new

                    {

                        packageId,

                        citation = AzureExtractorCitationFormatter.FormatCostProofPoint(manifest),
                        manifest.SchemaVersion,

                        SubscriptionId = manifest.SubscriptionId,

                    },

                    AuditJsonSerializationOptions.Instance),

                CorrelationId = correlationId,

            },

            ct);

        return new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId, IsSchemaRejection = false };

    }

    private async Task TryAttachEvidenceBundleAsync(Guid runGuid, AzureExtractorPackageRecord record, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(record);

        IReadOnlyList<AgentTask> tasks = await agentTaskRepository.GetByRunIdAsync(runGuid.ToString("N"), ct);

        string? bundleRef = null;

        foreach (AgentTask task in tasks)

            if (!string.IsNullOrWhiteSpace(task.EvidenceBundleRef))

            {

                bundleRef = task.EvidenceBundleRef!.Trim();

                break;

            }

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
                    new { reason = detail, uploadedFileName, uploadedBytes },

                    AuditJsonSerializationOptions.Instance),

                CorrelationId = correlationId,

            },

            ct);

        return new AzureExtractorIngestResult

        {

            Succeeded = false,

            FailureDetail = detail,

            IsSchemaRejection = schemaRejection,

        };

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

}
