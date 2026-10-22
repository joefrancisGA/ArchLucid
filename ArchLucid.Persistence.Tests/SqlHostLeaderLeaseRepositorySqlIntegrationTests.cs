using ArchLucid.Persistence.Data.Repositories;

using Dapper;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>SQL lease repository contention and failover behavior for host leader election (TB-2167).</summary>
[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class SqlHostLeaderLeaseRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string LeaseName = "integration-test:host-leader-contention";

    [SkippableFact]
    public async Task TryAcquireOrRenewAsync_two_instances_contend_exactly_one_holds_lease()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlTestDbConnectionFactory connectionFactory = new(fixture.ConnectionString);
        SqlHostLeaderLeaseRepository sut = new(connectionFactory);

        await CleanupLeaseAsync(connectionFactory);

        bool instanceAAcquired = await sut.TryAcquireOrRenewAsync(LeaseName, "instance-a", 60, CancellationToken.None);
        bool instanceBWhileAHeld = await sut.TryAcquireOrRenewAsync(LeaseName, "instance-b", 60, CancellationToken.None);

        instanceAAcquired.Should().BeTrue();
        instanceBWhileAHeld.Should().BeFalse();

        await sut.TryReleaseAsync(LeaseName, "instance-a", CancellationToken.None);

        bool instanceBAfterRelease = await sut.TryAcquireOrRenewAsync(LeaseName, "instance-b", 60, CancellationToken.None);

        instanceBAfterRelease.Should().BeTrue();

        IReadOnlyList<HostLeaderLeaseSnapshot> rows = await sut.ListAllAsync(CancellationToken.None);
        HostLeaderLeaseSnapshot? row = rows.SingleOrDefault(r => r.LeaseName == LeaseName);

        row.Should().NotBeNull();
        row!.HolderInstanceId.Should().Be("instance-b");
        row.LeaseExpiresUtc.Should().BeAfter(DateTime.UtcNow);

        await CleanupLeaseAsync(connectionFactory);
    }

    [SkippableFact]
    public async Task TryAcquireOrRenewAsync_expired_lease_allows_new_holder()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlTestDbConnectionFactory connectionFactory = new(fixture.ConnectionString);
        SqlHostLeaderLeaseRepository sut = new(connectionFactory);

        await CleanupLeaseAsync(connectionFactory);

        bool firstAcquire = await sut.TryAcquireOrRenewAsync(LeaseName, "instance-a", 1, CancellationToken.None);
        firstAcquire.Should().BeTrue();

        await Task.Delay(TimeSpan.FromSeconds(2));

        bool secondAcquire = await sut.TryAcquireOrRenewAsync(LeaseName, "instance-b", 60, CancellationToken.None);
        secondAcquire.Should().BeTrue();

        IReadOnlyList<HostLeaderLeaseSnapshot> rows = await sut.ListAllAsync(CancellationToken.None);
        rows.Single(r => r.LeaseName == LeaseName).HolderInstanceId.Should().Be("instance-b");

        await CleanupLeaseAsync(connectionFactory);
    }

    private static async Task CleanupLeaseAsync(SqlTestDbConnectionFactory connectionFactory)
    {
        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        await connection.ExecuteAsync(
            "DELETE FROM dbo.HostLeaderLeases WHERE LeaseName = @LeaseName",
            new { LeaseName });
    }
}
