using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor.Stages;

public sealed class AzureExtractorPreparedZipValidateStage(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IRunRepository runRepository,
    IAzureExtractorResultEnricher inventoryEnricher,
    IOptions<AzureExtractorEnrichmentOptions> enrichmentOptions,
    ILogger<AzureExtractorPreparedZipValidateStage> logger) : IAzureExtractorPreparedZipValidateStage
{
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IOptions<AzureExtractorEnrichmentOptions> _enrichmentOptions = enrichmentOptions ?? throw new ArgumentNullException(nameof(enrichmentOptions));
    private readonly IAzureExtractorResultEnricher _inventoryEnricher = inventoryEnricher ?? throw new ArgumentNullException(nameof(inventoryEnricher));
    private readonly ILogger<AzureExtractorPreparedZipValidateStage> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<AzureExtractorPreparedZipValidateResult> ValidateAsync(
        byte[] zipBytes, string safeName, Guid? runId, string? correlationId, long maxAcceptedZipBytes, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        using Activity? uploadActivity = ArchLucidInstrumentation.AzureExtractorUpload.StartActivity("azure_extractor.upload.ingest");
        uploadActivity?.SetTag("archlucid.azure_extractor.file_size_bytes", zipBytes.LongLength);

        using MemoryStream validationStream = new(zipBytes, writable: false);
        AzureExtractorZipValidationResult zipValidation = AzureExtractorPackageZipValidator.Validate(validationStream);
        if (!zipValidation.IsValid)
        {
            string eventType = zipValidation.IsSchemaRejection ? AuditEventTypes.AzureExtractorPackageSchemaRejected : AuditEventTypes.AzureExtractorPackageParseFailed;
            return new AzureExtractorPreparedZipValidateResult { Failure = await FailAsync(eventType, zipValidation.ErrorDetail ?? "Invalid Azure extractor ZIP.", zipValidation.IsSchemaRejection, zipValidation.IsInvalidArchive, actor, scope, correlationId, safeName, zipBytes.LongLength, ct) };
        }

        uploadActivity?.SetTag("archlucid.azure_extractor.file_entry_count", zipValidation.FileEntryCount);
        if (zipBytes.LongLength > maxAcceptedZipBytes)
            return new AzureExtractorPreparedZipValidateResult { Failure = await FailAsync(AuditEventTypes.AzureExtractorPackageParseFailed, $"ZIP exceeds maximum size of {maxAcceptedZipBytes} bytes.", false, false, actor, scope, correlationId, safeName, zipBytes.LongLength, ct) };

        await _auditService.LogAsync(new AuditEvent
        {
            EventType = AuditEventTypes.AzureExtractorPackageUploaded,
            ActorUserId = actor, ActorUserName = actor,
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(new { originalFileName = safeName, sizeBytes = zipBytes.LongLength }, AuditJsonSerializationOptions.Instance),
            CorrelationId = correlationId,
        }, ct);

        using MemoryStream zipStream = new(zipBytes);
        (AzureExtractorNormalizedManifest? manifest, string? manifestError) = AzureExtractorManifestReader.TryReadNormalizedFromZip(zipStream);
        if (manifestError is not null)
        {
            bool schemaReject = manifestError.StartsWith("Unsupported manifest schemaVersion", StringComparison.Ordinal) || manifestError.Contains("schemaVersion", StringComparison.Ordinal) || manifestError.Contains("manifest.json", StringComparison.Ordinal);
            string eventType = schemaReject ? AuditEventTypes.AzureExtractorPackageSchemaRejected : AuditEventTypes.AzureExtractorPackageParseFailed;
            return new AzureExtractorPreparedZipValidateResult { Failure = await FailAsync(eventType, manifestError, schemaReject, false, actor, scope, correlationId, safeName, zipBytes.LongLength, ct) };
        }

        if (manifest is null)
            return new AzureExtractorPreparedZipValidateResult { Failure = await FailAsync(AuditEventTypes.AzureExtractorPackageParseFailed, "manifest.json could not be loaded.", true, false, actor, scope, correlationId, safeName, zipBytes.LongLength, ct) };

        zipBytes = await TryEnrichPackageInventoryAsync(zipBytes, ct).ConfigureAwait(false);
        if (runId is { } runGuid)
        {
            RunRecord? existing = await _runRepository.GetByIdAsync(scope, runGuid, ct);
            if (existing is null)
                return new AzureExtractorPreparedZipValidateResult { Failure = await FailAsync(AuditEventTypes.AzureExtractorPackageParseFailed, "Run id is not recognized in this workspace scope.", false, false, actor, scope, correlationId, safeName, zipBytes.LongLength, ct) };
        }

        return new AzureExtractorPreparedZipValidateResult
        {
            Context = new AzureExtractorPreparedZipValidatedContext
            {
                ZipBytes = zipBytes, SafeName = safeName, Manifest = manifest, Scope = scope, Actor = actor, RunId = runId, CorrelationId = correlationId,
            },
        };
    }

    private async Task<AzureExtractorIngestResult> FailAsync(string eventType, string detail, bool schemaRejection, bool invalidArchive, string actor, ScopeContext scope, string? correlationId, string? uploadedFileName, long? uploadedBytes, CancellationToken ct)
    {
        await _auditService.LogAsync(new AuditEvent
        {
            EventType = eventType, ActorUserId = actor, ActorUserName = actor,
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(new { reason = detail, uploadedFileName, uploadedBytes }, AuditJsonSerializationOptions.Instance),
            CorrelationId = correlationId,
        }, ct);
        return new AzureExtractorIngestResult { Succeeded = false, FailureDetail = detail, IsSchemaRejection = schemaRejection, IsInvalidArchive = invalidArchive };
    }

    private async Task<byte[]> TryEnrichPackageInventoryAsync(byte[] zipBytes, CancellationToken ct)
    {
        if (!_enrichmentOptions.Value.Enabled) return zipBytes;
        IReadOnlyList<AzureExtractorInventoryResourceLine> lines = AzureExtractorInventoryZipPatcher.ReadLines(zipBytes);
        if (lines.Count == 0) return zipBytes;
        return AzureExtractorInventoryZipPatcher.TryPatchResourcesJson(zipBytes, await _inventoryEnricher.EnrichAsync(lines, ct).ConfigureAwait(false));
    }
}
