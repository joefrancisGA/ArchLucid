using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Cosmos;

using Dapper;

namespace ArchLucid.Persistence.Tests.Coordination;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class CosmosGraphSnapshotOutboxDeferralSqlTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Only_current_lease_can_defer_without_consuming_attempt_or_reclaiming_early()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        CancellationToken ct = CancellationToken.None;
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperCosmosGraphSnapshotOutboxRepository repository = new(factory);
        Guid graphId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        await using var connection = await factory.CreateOpenConnectionAsync(ct);
        try
        {
            await repository.EnqueueAsync(graphId, runId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), ct);
            CosmosGraphSnapshotOutboxEntry job = (await repository.DequeuePendingAsync(100, 300, ct))
                .Should().ContainSingle(row => row.GraphSnapshotId == graphId).Subject;
            job.LockedUntilUtc.Should().NotBeNull();
            DateTime lease = job.LockedUntilUtc!.Value;
            DateTime nextAttempt = DateTime.UtcNow.AddMinutes(20);
            const string statusSql = """
                SELECT LockedUntilUtc, NextAttemptUtc, AttemptCount
                FROM dbo.CosmosGraphSnapshotOutbox WHERE OutboxId = @OutboxId;
                """;

            await repository.DeferUntilAsync(job.OutboxId, lease.AddTicks(-1), nextAttempt, ct);
            LeaseState unchanged = await connection.QuerySingleAsync<LeaseState>(statusSql, new { job.OutboxId });
            unchanged.LockedUntilUtc.Should().Be(lease);
            unchanged.NextAttemptUtc.Should().BeNull();
            unchanged.AttemptCount.Should().Be(job.AttemptCount);

            await repository.DeferUntilAsync(job.OutboxId, lease, nextAttempt, ct);
            LeaseState deferred = await connection.QuerySingleAsync<LeaseState>(statusSql, new { job.OutboxId });
            deferred.LockedUntilUtc.Should().BeNull();
            deferred.NextAttemptUtc.Should().Be(nextAttempt);
            deferred.AttemptCount.Should().Be(job.AttemptCount);
            (await repository.DequeuePendingAsync(100, 300, ct)).Should().NotContain(row => row.OutboxId == job.OutboxId);
        }
        finally
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.CosmosGraphSnapshotOutbox WHERE GraphSnapshotId = @graphId AND RunId = @runId;",
                new { graphId, runId });
        }
    }

    private sealed class LeaseState
    {
        public DateTime? LockedUntilUtc { get; init; }
        public DateTime? NextAttemptUtc { get; init; }
        public int AttemptCount { get; init; }
    }
}
