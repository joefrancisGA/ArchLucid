using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Admin;

/// <inheritdoc cref="IAdminOutboxSnapshotReader" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent reader; covered via admin API integration tests.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Operator outbox depth metrics aggregate across tenants for admin dashboards.")]
public sealed class DapperAdminOutboxSnapshotReader(ISqlConnectionFactory connectionFactory) : IAdminOutboxSnapshotReader
{
    private const string BatchSql = """
                                    SELECT COUNT_BIG(1)
                                    FROM dbo.AuthorityPipelineWorkOutbox
                                    WHERE ProcessedUtc IS NULL
                                      AND DeadLetteredUtc IS NULL
                                      AND (NextAttemptUtc IS NULL OR NextAttemptUtc <= SYSUTCDATETIME())
                                      AND (LockedUntilUtc IS NULL OR LockedUntilUtc <= SYSUTCDATETIME());

                                    SELECT COUNT_BIG(1)
                                    FROM dbo.AuthorityPipelineWorkOutbox
                                    WHERE DeadLetteredUtc IS NOT NULL
                                      AND ProcessedUtc IS NULL;

                                    SELECT COUNT_BIG(1)
                                    FROM dbo.RetrievalIndexingOutbox
                                    WHERE ProcessedUtc IS NULL
                                      AND DeadLetteredUtc IS NULL;

                                    SELECT COUNT_BIG(1)
                                    FROM dbo.IntegrationEventOutbox
                                    WHERE ProcessedUtc IS NULL
                                      AND DeadLetteredUtc IS NULL;

                                    SELECT COUNT_BIG(1)
                                    FROM dbo.IntegrationEventOutbox
                                    WHERE DeadLetteredUtc IS NOT NULL
                                      AND ProcessedUtc IS NULL;
                                    """;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<AdminOutboxSnapshotCounts> ReadAsync(CancellationToken cancellationToken = default)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(BatchSql, cancellationToken: cancellationToken));

        long authorityPending = await multi.ReadSingleAsync<long>();
        long authorityDead = await multi.ReadSingleAsync<long>();
        long retrievalPending = await multi.ReadSingleAsync<long>();
        long integrationPending = await multi.ReadSingleAsync<long>();
        long integrationDead = await multi.ReadSingleAsync<long>();

        return new AdminOutboxSnapshotCounts(
            authorityPending,
            authorityDead,
            retrievalPending,
            integrationPending,
            integrationDead);
    }
}
