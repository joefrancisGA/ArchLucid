using ArchLucid.Persistence.Concurrency;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Concurrency;

/// <summary>
///     SQL integration coverage for <see cref="SqlSessionDistributedCreateRunIdempotencyLock" /> session locks (TB-301 hotspot).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlSessionDistributedCreateRunIdempotencyLockSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string LockResource = "ArchLucid.Persistence.Tests.CreateRunIdempotencyLock";

    [SkippableFact]
    public async Task AcquireExclusiveSessionLock_blocks_second_holder_until_release()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        SqlSessionDistributedCreateRunIdempotencyLock gate = new(sqlFactory);

        await using IAsyncDisposable first = await gate.AcquireExclusiveSessionLockAsync(
            LockResource,
            lockTimeoutMs: 5_000,
            CancellationToken.None);

        SqlSessionDistributedCreateRunIdempotencyLock contender = new(sqlFactory);

        Func<Task> secondAcquire = async () =>
        {
            await using IAsyncDisposable second = await contender.AcquireExclusiveSessionLockAsync(
                LockResource,
                lockTimeoutMs: 250,
                CancellationToken.None);
        };

        await secondAcquire.Should().ThrowAsync<TimeoutException>(
            "sp_getapplock must serialize create-run idempotency holders on the same resource.");
    }

    [SkippableFact]
    public async Task AcquireExclusiveSessionLock_allows_reacquire_after_dispose()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory sqlFactory = new(fixture.ConnectionString);
        SqlSessionDistributedCreateRunIdempotencyLock gate = new(sqlFactory);

        await using (IAsyncDisposable first = await gate.AcquireExclusiveSessionLockAsync(
                         LockResource,
                         lockTimeoutMs: 5_000,
                         CancellationToken.None))
        {
            first.Should().NotBeNull();
        }

        await using IAsyncDisposable second = await gate.AcquireExclusiveSessionLockAsync(
            LockResource,
            lockTimeoutMs: 5_000,
            CancellationToken.None);

        second.Should().NotBeNull();
    }
}
