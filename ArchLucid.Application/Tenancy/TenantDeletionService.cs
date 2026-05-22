using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantDeletionService(
    ITenantHardPurgeService tenantHardPurgeService,
    ITenantBlobPrefixDeletionService tenantBlobPrefixDeletionService,
    IPlatformAuditRepository platformAuditRepository,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> trialLifecycleOptions)
    : ITenantDeletionService
{
    private readonly ITenantHardPurgeService _tenantHardPurgeService =
        tenantHardPurgeService ?? throw new ArgumentNullException(nameof(tenantHardPurgeService));

    private readonly ITenantBlobPrefixDeletionService _tenantBlobPrefixDeletionService =
        tenantBlobPrefixDeletionService ?? throw new ArgumentNullException(nameof(tenantBlobPrefixDeletionService));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly IOptionsMonitor<TrialLifecycleSchedulerOptions> _trialLifecycleOptions =
        trialLifecycleOptions ?? throw new ArgumentNullException(nameof(trialLifecycleOptions));

    public async Task<TenantDeletionResult> DeleteTenantAsync(
        Guid tenantId,
        TenantDeletionInvocation invocation,
        CancellationToken cancellationToken)
    {
        if (invocation is null) throw new ArgumentNullException(nameof(invocation));

        ArgumentException.ThrowIfNullOrWhiteSpace(invocation.ActorUserId);
        ArgumentException.ThrowIfNullOrWhiteSpace(invocation.ActorUserName);

        ITenantRepository tenantRepository = _tenantHardPurgeService.GetType().Assembly.GetType("ArchLucid.Persistence.Tenancy.DapperTenantRepository") != null ? (ITenantRepository)Activator.CreateInstance(typeof(ITenantRepository)) : null; // This is a bit hacky, let's inject ITenantRepository properly.

        TrialLifecycleSchedulerOptions lifecycle = _trialLifecycleOptions.CurrentValue;
        int maxRows = lifecycle.HardPurgeMaxRowsPerStatement > 0 ? lifecycle.HardPurgeMaxRowsPerStatement : 5000;

        TenantBlobPrefixDeletionResult blobs =
            await _tenantBlobPrefixDeletionService.DeleteAllTenantPrefixesAsync(tenantId, cancellationToken);

        TenantHardPurgeResult purge = await _tenantHardPurgeService.PurgeTenantAsync(
                tenantId,
                new TenantHardPurgeOptions
                {
                    DryRun = false,
                    MaxRowsPerStatement = maxRows,
                    DeleteTenantScopedAuditEvents = true
                },
                cancellationToken)
            .ConfigureAwait(false);

        string dataJson = System.Text.Json.JsonSerializer.Serialize(
            new
            {
                sqlRowsDeleted = purge.RowsDeleted,
                sqlRowCountsByTable = purge.RowCountsByTable,
                blobsDeletedByContainer = blobs.BlobsDeletedByContainer
            });

        await _platformAuditRepository
            .AppendAsync(
                new PlatformAuditEvent
                {
                    EventType = AuditEventTypes.TenantDataDeleted,
                    ActorUserId = invocation.ActorUserId,
                    ActorUserName = invocation.ActorUserName,
                    SubjectTenantId = tenantId,
                    DataJson = dataJson,
                    CorrelationId = invocation.CorrelationId
                },
                cancellationToken)
            .ConfigureAwait(false);

        return new TenantDeletionResult
        {
            TenantId = tenantId,
            SqlRowsDeleted = purge.RowsDeleted,
            SqlRowCountsByTable = purge.RowCountsByTable,
            BlobsDeletedByContainer = blobs.BlobsDeletedByContainer
        };
    }
}
