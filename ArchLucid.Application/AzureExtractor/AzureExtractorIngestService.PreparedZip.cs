using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Logging;

using Serilog.Context;

namespace ArchLucid.Application.AzureExtractor;

public sealed partial class AzureExtractorIngestService
{
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

        ActivityScopeTags.ApplyEvidencePackageId(Activity.Current, packageId);

        using (LogContext.PushProperty("EvidencePackageId", packageId.ToString("D")))
        {
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

        ScopeContext attachScope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> tasks = await agentTaskRepository.GetByRunIdAsync(attachScope, runGuid.ToString("N"), ct);

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
