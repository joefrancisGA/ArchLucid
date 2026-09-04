using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

using Serilog.Context;

namespace ArchLucid.Application.AzureExtractor.Stages;

public sealed class AzureExtractorPreparedZipPersistStage(
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IAzureExtractorPackageRepository packageRepository,
    IAzureInventorySnapshotHeaderService inventorySnapshotHeaderService,
    IAgentTaskRepository agentTaskRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    ILogger<AzureExtractorPreparedZipPersistStage> logger) : IAzureExtractorPreparedZipPersistStage
{
    private readonly IAgentTaskRepository _agentTaskRepository = agentTaskRepository ?? throw new ArgumentNullException(nameof(agentTaskRepository));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IEvidenceBundleRepository _evidenceBundleRepository = evidenceBundleRepository ?? throw new ArgumentNullException(nameof(evidenceBundleRepository));
    private readonly IAzureInventorySnapshotHeaderService _inventorySnapshotHeaderService = inventorySnapshotHeaderService ?? throw new ArgumentNullException(nameof(inventorySnapshotHeaderService));
    private readonly ILogger<AzureExtractorPreparedZipPersistStage> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IAzureExtractorPackageRepository _packageRepository = packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<AzureExtractorIngestResult> PersistAsync(AzureExtractorPreparedZipValidatedContext context, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(context);
        AzureExtractorNormalizedManifest manifest = context.Manifest;
        ScopeContext scope = context.Scope;
        byte[] zipBytes = context.ZipBytes;
        Guid? runId = context.RunId;
        Guid packageId = Guid.NewGuid();
        ActivityScopeTags.ApplyEvidencePackageId(Activity.Current, packageId);
        using (LogContext.PushProperty("EvidencePackageId", packageId.ToString("D")))
        {
            AzureExtractorPackageRecord record = new()
            {
                PackageId = packageId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
                RunId = runId, CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                SchemaVersion = manifest.SchemaVersion, ScriptVersion = manifest.ScriptVersion,
                CollectionTimestampUtc = manifest.CollectionTimestamp.UtcDateTime, SubscriptionId = manifest.SubscriptionId,
                OriginalFileName = context.SafeName, ManifestJson = manifest.RawJson, PackageBytes = zipBytes,
            };
            await _packageRepository.InsertAsync(record, ct);

            try
            {
                await _inventorySnapshotHeaderService.TryCreatePendingFromPackageAsync(
                    scope,
                    packageId,
                    manifest.SubscriptionId,
                    subscriptionName: null,
                    manifest.CollectionTimestamp.UtcDateTime,
                    manifest.SchemaVersion.ToString(),
                    manifest.ScriptVersion,
                    context.Actor,
                    allowRecapture: false,
                    ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Azure extractor ingest succeeded but inventory snapshot header creation failed for PackageId={PackageId}.",
                    packageId);
            }

            if (runId is { } mergedRunGuid)
            {
                try { await TryAttachEvidenceBundleAsync(mergedRunGuid, record, ct); }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogWarning(ex, "Azure extractor ingest succeeded but evidence bundle attachment failed for RunId={RunId:N}.", mergedRunGuid);
                }
            }
            await _auditService.LogAsync(new AuditEvent
            {
                EventType = AuditEventTypes.AzureExtractorPackageIngestSucceeded,
                ActorUserId = context.Actor, ActorUserName = context.Actor,
                TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId, RunId = runId,
                DataJson = JsonSerializer.Serialize(new { packageId, citation = AzureExtractorCitationFormatter.FormatCostProofPoint(manifest), manifest.SchemaVersion, manifest.SubscriptionId }, AuditJsonSerializationOptions.Instance),
                CorrelationId = context.CorrelationId,
            }, ct);
            return new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId, IsSchemaRejection = false };
        }
    }

    private async Task TryAttachEvidenceBundleAsync(Guid runGuid, AzureExtractorPackageRecord record, CancellationToken ct)
    {
        ScopeContext attachScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> tasks = await _agentTaskRepository.GetByRunIdAsync(attachScope, runGuid.ToString("N"), ct);
        string? bundleRef = tasks.Select(t => t.EvidenceBundleRef?.Trim()).FirstOrDefault(r => !string.IsNullOrWhiteSpace(r));
        if (string.IsNullOrWhiteSpace(bundleRef)) return;
        EvidenceBundle? bundle = await _evidenceBundleRepository.GetByIdAsync(bundleRef, ct);
        if (bundle is null) return;
        AzureExtractorEvidenceBundleMerger.Merge(bundle, AzureExtractorPackageProvenance.FromRecord(record));
        await _evidenceBundleRepository.UpdateAsync(bundle, ct);
    }
}
