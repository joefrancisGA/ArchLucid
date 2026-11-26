using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Suite", "Core")]
public abstract class UsageEventRetryContractTests
{
    private const string FirstKey = "request-first";
    private const string SecondKey = "request-second";
    private static readonly DateTimeOffset RecordedUtc = new(2026, 5, 1, 10, 0, 0, TimeSpan.Zero);

    protected virtual void SkipIfUnavailable() { }
    protected abstract IUsageEventRepository CreateRepository();

    [SkippableFact]
    public async Task Single_and_batch_retries_keep_distinct_operations_with_identical_usage_payloads()
    {
        SkipIfUnavailable();
        IUsageEventRepository repository = CreateRepository();
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        UsageEvent first = NewEvent(tenant, workspace, project, FirstKey);
        UsageEvent second = NewEvent(tenant, workspace, project, SecondKey);

        await repository.InsertAsync(first, CancellationToken.None);
        await repository.InsertBatchAsync(
            [NewEvent(tenant, workspace, project, FirstKey), second, NewEvent(tenant, workspace, project, SecondKey)],
            CancellationToken.None);
        await repository.InsertAsync(NewEvent(tenant, workspace, project, SecondKey), CancellationToken.None);

        IReadOnlyList<UsageEvent> rows = await LoadAndAssertTotalAsync(repository, tenant);
        rows.Select(row => (row.IdempotencyKey, row.Id))
            .Should().BeEquivalentTo(new[] { (first.IdempotencyKey, first.Id), (second.IdempotencyKey, second.Id) });
    }

    [SkippableFact]
    public async Task Concurrent_first_writes_with_one_key_commit_one_usage_event()
    {
        SkipIfUnavailable();
        IUsageEventRepository repository = CreateRepository();
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();

        Guid[] attemptedIds = await RetryTestStartGate.RunTogetherAsync(6, async (_, ct) =>
        {
            UsageEvent attempt = NewEvent(tenant, workspace, project, FirstKey);
            await repository.InsertAsync(attempt, ct);
            return attempt.Id;
        });

        UsageEvent distinct = NewEvent(tenant, workspace, project, SecondKey);
        await repository.InsertAsync(distinct, CancellationToken.None);

        IReadOnlyList<UsageEvent> rows = await LoadAndAssertTotalAsync(repository, tenant);
        rows.Select(row => row.IdempotencyKey).Should().BeEquivalentTo(new[] { FirstKey, SecondKey });
        attemptedIds.Should().Contain(rows.Single(row => row.IdempotencyKey == FirstKey).Id);
        rows.Single(row => row.IdempotencyKey == SecondKey).Id.Should().Be(distinct.Id);
    }

    private static UsageEvent NewEvent(Guid tenant, Guid workspace, Guid project, string key) =>
        new()
        {
            TenantId = tenant, WorkspaceId = workspace, ProjectId = project,
            Kind = UsageMeterKind.ApiRequest, Quantity = 7, RecordedUtc = RecordedUtc,
            CorrelationId = "same-request-payload",
            IdempotencyKey = key,
        };

    private static async Task<IReadOnlyList<UsageEvent>> LoadAndAssertTotalAsync(IUsageEventRepository repository, Guid tenant)
    {
        DateTimeOffset from = RecordedUtc.AddMinutes(-1);
        DateTimeOffset to = RecordedUtc.AddMinutes(1);
        IReadOnlyList<UsageEvent> rows = await repository.ListAsync(tenant, from, to, UsageMeterKind.ApiRequest, 10, CancellationToken.None);
        rows.Should().HaveCount(2);
        rows.Should().AllSatisfy(row => row.Quantity.Should().Be(7));

        IReadOnlyList<TenantUsageSummary> totals = await repository.AggregateByKindAsync(tenant, from, to, CancellationToken.None);
        TenantUsageSummary api = totals.Should().ContainSingle().Subject;
        api.Kind.Should().Be(UsageMeterKind.ApiRequest);
        api.TotalQuantity.Should().Be(14);
        return rows;
    }
}

[Trait("Category", "Unit")]
public sealed class InMemoryUsageEventRetryContractTests : UsageEventRetryContractTests
{
    protected override IUsageEventRepository CreateRepository() => new InMemoryUsageEventRepository();
}

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperUsageEventRetryContractTests(SqlServerPersistenceFixture fixture) : UsageEventRetryContractTests
{
    protected override void SkipIfUnavailable() =>
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

    protected override IUsageEventRepository CreateRepository() =>
        new DapperUsageEventRepository(new TestSqlConnectionFactory(fixture.ConnectionString));
}
