using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlFindingInsightSignalRepositoryTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task TryInsertAsync_concurrent_repeats_return_the_same_signal()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlFindingInsightSignalRepository repository = new(new TestSqlConnectionFactory(fixture.ConnectionString));
        FindingInsightSignalSubmission submission = new()
        {
            TenantId = GovernanceRepositoryContractScope.TenantId,
            RunId = Guid.NewGuid(),
            FindingId = "concurrent-signal",
            UserId = "operator@example.com",
            Kind = FindingInsightSignalKind.DidNotThinkOfThat,
        };

        TaskCompletionSource start = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<FindingInsightSignalInsertResult>[] attempts = Enumerable.Range(0, 16)
            .Select(async _ =>
            {
                await start.Task;
                return await repository.TryInsertAsync(submission);
            })
            .ToArray();
        start.SetResult();

        FindingInsightSignalInsertResult[] results = await Task.WhenAll(attempts);
        FindingInsightSignalInsertResult created = results.Should().ContainSingle(result => result.Created).Which;
        results.Should().OnlyContain(result => result.SignalId == created.SignalId);
    }
}
