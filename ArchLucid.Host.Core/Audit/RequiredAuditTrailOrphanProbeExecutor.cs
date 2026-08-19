using System.Data.Common;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Audit;

/// <summary>
///     Counts Required domain rows missing expected audit events and emits pageable metrics (TB-955).
/// </summary>
public sealed class RequiredAuditTrailOrphanProbeExecutor(
    IOptionsMonitor<RequiredAuditTrailProbeOptions> optionsMonitor,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    ILogger<RequiredAuditTrailOrphanProbeExecutor> logger) : IRequiredAuditTrailOrphanProbeExecutor
{
    private readonly IOptionsMonitor<RequiredAuditTrailProbeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly ILogger<RequiredAuditTrailOrphanProbeExecutor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return;

        RequiredAuditTrailProbeOptions snapshot = _optionsMonitor.CurrentValue;

        if (!snapshot.OrphanProbeEnabled)
            return;

        int graceMinutes = Math.Clamp(snapshot.OrphanProbeGraceMinutes, 1, 24 * 60);
        int lookbackDays = Math.Clamp(snapshot.OrphanProbeLookbackDays, 1, 90);

        await using DbConnection connection =
            (DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        long approvedOrphans = await CountAsync(
                connection,
                RequiredAuditTrailOrphanProbeSql.GovernanceApprovedMissingAudit,
                graceMinutes,
                lookbackDays,
                cancellationToken)
            .ConfigureAwait(false);

        long rejectedOrphans = await CountAsync(
                connection,
                RequiredAuditTrailOrphanProbeSql.GovernanceRejectedMissingAudit,
                graceMinutes,
                lookbackDays,
                cancellationToken)
            .ConfigureAwait(false);

        long finalizeOrphans = await CountAsync(
                connection,
                RequiredAuditTrailOrphanProbeSql.GoldenManifestMissingFinalizedAudit,
                graceMinutes,
                lookbackDays,
                cancellationToken)
            .ConfigureAwait(false);

        EmitSlice(RequiredAuditTrailOrphanProbeSql.DomainGovernanceApproved, approvedOrphans);
        EmitSlice(RequiredAuditTrailOrphanProbeSql.DomainGovernanceRejected, rejectedOrphans);
        EmitSlice(RequiredAuditTrailOrphanProbeSql.DomainGoldenManifestFinalized, finalizeOrphans);
    }

    private void EmitSlice(string domain, long count)
    {
        ArchLucidInstrumentation.RecordRequiredAuditTrailOrphan(domain, count);

        if (count <= 0)
            return;

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Required audit trail orphan probe: domain={Domain} missingExpectedAuditCount={Count}. Triage: docs/runbooks/REQUIRED_AUDIT_TRAIL_ORPHAN_TRIAGE.md",
                domain,
                count);
        }
    }

    private static async Task<long> CountAsync(
        DbConnection connection,
        string sql,
        int graceMinutes,
        int lookbackDays,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;

        DbParameter grace = command.CreateParameter();
        grace.ParameterName = "@GraceMinutes";
        grace.Value = graceMinutes;
        command.Parameters.Add(grace);

        DbParameter lookback = command.CreateParameter();
        lookback.ParameterName = "@LookbackDays";
        lookback.Value = lookbackDays;
        command.Parameters.Add(lookback);

        object? scalar = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);

        if (scalar is null || scalar is DBNull)
            return 0;

        return Convert.ToInt64(scalar, System.Globalization.CultureInfo.InvariantCulture);
    }
}
