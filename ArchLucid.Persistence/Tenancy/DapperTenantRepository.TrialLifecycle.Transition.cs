using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT Id
                           FROM dbo.Tenants
                           WHERE TrialExpiresUtc IS NOT NULL
                             AND TrialStatus IS NOT NULL
                             AND TrialStatus <> @Converted
                           ORDER BY CreatedUtc ASC;
                           """;

        if (_topologyOptions.CurrentValue.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs)
        {
            await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TrialLifecycleStatus.Converted
                    },
                    cancellationToken: ct)).ConfigureAwait(false);

            return ids.ToList();
        }

        IReadOnlyList<TenantDatabaseBindingRecord> actives =
            await _tenantDatabaseBindingRepository.ListBindingsWithStateAsync(TenantDatabaseProvisioningState.Active, ct);

        HashSet<Guid> merged = [];

        foreach (TenantDatabaseBindingRecord binding in actives)
        {
            string cs =
                await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(binding.TenantId, ct);

            await using SqlConnection connection = new(SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(cs));

            await connection.OpenAsync(ct);

            IEnumerable<Guid> ids = await connection.QueryAsync<Guid>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TrialLifecycleStatus.Converted
                    },
                    cancellationToken: ct)).ConfigureAwait(false);

            foreach (Guid id in ids)
                merged.Add(id);
        }

        return merged.ToList();
    }

    /// <inheritdoc />
    public async Task<bool> TryRecordTrialLifecycleTransitionAsync(
        Guid tenantId,
        string expectedCurrentStatus,
        string nextStatus,
        string reason,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedCurrentStatus);
        ArgumentException.ThrowIfNullOrWhiteSpace(nextStatus);

        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        const string insertLog = """
                                 INSERT INTO dbo.TenantLifecycleTransitions (TenantId, FromStatus, ToStatus, OccurredUtc, Reason)
                                 VALUES (@TenantId, @FromStatus, @ToStatus, SYSUTCDATETIME(), @Reason);
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertLog,
                new
                {
                    TenantId = tenantId,
                    FromStatus = expectedCurrentStatus,
                    ToStatus = nextStatus,
                    Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim()
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        const string updateTenant = """
                                    UPDATE dbo.Tenants
                                    SET TrialStatus = @NextStatus
                                    WHERE Id = @TenantId AND TrialStatus = @ExpectedStatus;
                                    """;

        int updated = await connection.ExecuteAsync(
            new CommandDefinition(
                updateTenant,
                new
                {
                    TenantId = tenantId,
                    ExpectedStatus = expectedCurrentStatus,
                    NextStatus = nextStatus
                },
                tran,
                cancellationToken: ct)).ConfigureAwait(false);

        if (updated == 0)
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);

            return false;
        }

        await tran.CommitAsync(ct).ConfigureAwait(false);

        return true;
    }

    /// <inheritdoc />
    public async Task E2eHarnessSetTrialExpiresUtcAsync(Guid tenantId, DateTimeOffset expiresUtc, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           UPDATE dbo.Tenants
                           SET TrialExpiresUtc = @ExpiresUtc
                           WHERE Id = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new
            {
                TenantId = tenantId,
                ExpiresUtc = expiresUtc
            }, cancellationToken: ct)).ConfigureAwait(false);
    }
}
