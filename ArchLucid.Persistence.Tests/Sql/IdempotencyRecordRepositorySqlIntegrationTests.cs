using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class IdempotencyRecordRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task TryInsertAsync_concurrent_attempts_preserve_the_first_replay_response()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        IdempotencyRecordRepository repository = new(new TestSqlDbConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        string key = Guid.NewGuid().ToString("N");
        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<(bool Inserted, string Response)>[] attempts = Enumerable.Range(0, 16)
            .Select(async index =>
            {
                string response = $$"""{"attempt":{{index}}}""";
                await start.Task;
                return (await repository.TryInsertAsync(tenantId, key, 201, response), response);
            })
            .ToArray();

        start.SetResult();
        (bool Inserted, string Response)[] results = await Task.WhenAll(attempts);
        (bool Inserted, string Response) winner = results.Should().ContainSingle(result => result.Inserted).Which;
        IdempotencyRecordRow? stored = await repository.TryGetAsync(tenantId, key);

        stored.Should().NotBeNull();
        stored!.ResponseBody.Should().Be(winner.Response);
        stored.StatusCode.Should().Be(201);
    }
}
