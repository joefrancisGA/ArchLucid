using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Sample;

/// <inheritdoc cref="ISampleRunPurgeService" />
public sealed class SampleRunPurgeService(
    IRunRepository runRepository,
    IPlatformAuditRepository platformAuditRepository,
    IOptionsMonitor<SampleRunPurgeOptions> optionsMonitor,
    ILogger<SampleRunPurgeService> logger) : ISampleRunPurgeService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly IOptionsMonitor<SampleRunPurgeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<SampleRunPurgeService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task<SampleRunPurgeResult> PurgeForTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        return PurgeInternalAsync(tenantId, createdBeforeUtc: null, cancellationToken);
    }

    /// <inheritdoc />
    public Task<SampleRunPurgeResult> PurgeExpiredAsync(DateTimeOffset createdBeforeUtc, CancellationToken cancellationToken)
        => PurgeInternalAsync(tenantId: null, createdBeforeUtc, cancellationToken);

    private async Task<SampleRunPurgeResult> PurgeInternalAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        CancellationToken cancellationToken)
    {
        SampleRunPurgeOptions opts = _optionsMonitor.CurrentValue;
        int batchSize = Math.Clamp(opts.BatchSize, 1, 10_000);
        int totalDeleted = 0;

        while (true)
        {
            RunSamplePurgeBatchResult batch =
                await _runRepository.HardDeleteSampleRunsBatchAsync(tenantId, createdBeforeUtc, batchSize, cancellationToken);

            if (batch.Deleted.Count == 0)
                break;

            totalDeleted += batch.Deleted.Count;

            if (batch.Deleted.Count < batchSize)
                break;
        }

        if (totalDeleted == 0)
            return new SampleRunPurgeResult { RunsDeleted = 0 };

        string trigger = tenantId.HasValue ? "first_real_commit" : "ttl_expiry";
        string dataJson = JsonSerializer.Serialize(new { runsDeleted = totalDeleted, trigger });

        await _platformAuditRepository
            .AppendAsync(
                new PlatformAuditEvent
                {
                    EventType = AuditEventTypes.SampleRunsPurged,
                    ActorUserId = "system",
                    ActorUserName = "sample-run-purge",
                    SubjectTenantId = Guid.Empty,
                    DataJson = dataJson
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Sample run purge completed: {RunsDeleted} rows removed (trigger={Trigger}, tenantFilter={TenantFilter}).",
                totalDeleted,
                trigger,
                tenantId?.ToString("D") ?? "all");
        }

        return new SampleRunPurgeResult { RunsDeleted = totalDeleted };
    }
}
