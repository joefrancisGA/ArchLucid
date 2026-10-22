using System.Data.Common;

using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
/// One-shot orphan counts + optional dry-run samples (same logic as <see cref="Hosted.DataConsistencyOrphanProbeHostedService"/> loop body).
/// </summary>
public sealed partial class DataConsistencyOrphanProbeExecutor(
    IOptionsMonitor<DataConsistencyProbeOptions> optionsMonitor,
    IOptionsMonitor<DataConsistencyEnforcementOptions> enforcementOptionsMonitor,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    IServiceScopeFactory scopeFactory,
    ILogger<DataConsistencyOrphanProbeExecutor> logger) : IDataConsistencyOrphanProbeExecutor
{
    private const int TenantBreakdownTopN = 8;

    private readonly IOptionsMonitor<DataConsistencyProbeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IOptionsMonitor<DataConsistencyEnforcementOptions> _enforcementOptionsMonitor =
        enforcementOptionsMonitor ?? throw new ArgumentNullException(nameof(enforcementOptionsMonitor));

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    // IServiceScopeFactory is used instead of injecting IAuditService directly because this class
    // is a singleton and IAuditService is scoped (it captures IHttpContextAccessor). A scope is
    // created only when an audit write is actually needed (auto-remediation path).
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<DataConsistencyOrphanProbeExecutor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>When storage is in-memory, returns immediately without opening SQL.</summary>
    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return;

        DataConsistencyProbeOptions snapshot = _optionsMonitor.CurrentValue;

        if (!snapshot.OrphanProbeEnabled)
            return;

        int sampleCap = Math.Clamp(snapshot.OrphanProbeRemediationDryRunLogMaxRows, 0, 500);

        await using DbConnection connection =
            (DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        Dictionary<string, long> orphanCounts = new(StringComparer.OrdinalIgnoreCase);

        foreach (DataConsistencyOrphanProbeRegistration registration in DataConsistencyOrphanProbeRegistry.BackgroundProbed)
        {
            string countSql = DataConsistencyOrphanProbeRegistry.ResolveBackgroundProbeCountSql(registration);
            long count = await LogAndCountOrphansAsync(
                    connection,
                    countSql,
                    registration.TableName,
                    registration.ColumnName,
                    cancellationToken)
                .ConfigureAwait(false);

            orphanCounts[registration.TableName] = count;
        }

        await RunHeaderRepointProbesAsync(connection, cancellationToken).ConfigureAwait(false);

        long goldenCount = orphanCounts["GoldenManifests"];
        long findingsCount = orphanCounts["FindingsSnapshots"];
        long contextCount = orphanCounts["ContextSnapshots"];
        long graphCount = orphanCounts["GraphSnapshots"];
        long artifactCount = orphanCounts["ArtifactBundles"];

        await ApplyEnforcementAsync(
                connection,
                goldenCount,
                findingsCount,
                contextCount,
                graphCount,
                cancellationToken)
            .ConfigureAwait(false);

        if (sampleCap <= 0)
            return;

        bool anyOrphans =
            goldenCount > 0
            || findingsCount > 0
            || contextCount > 0
            || graphCount > 0
            || artifactCount > 0;

        if (!anyOrphans)
            return;

        if (snapshot.EnableAutoRemediation && graphCount > 0)
        {
            await AutoRemediateOrphanGraphSnapshotsAsync(connection, sampleCap, cancellationToken).ConfigureAwait(false);
        }

        await LogRemediationDryRunSamplesAsync(
                connection,
                sampleCap,
                goldenCount,
                findingsCount,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
