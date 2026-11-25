using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperUsageEventRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task InsertAsync_same_idempotency_key_inserts_once()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperUsageEventRepository repository = new(connectionFactory);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        string idempotencyKey = $"test:{Guid.NewGuid():N}";

        UsageEvent first = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey
        };

        UsageEvent duplicate = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey
        };

        await repository.InsertAsync(first, CancellationToken.None);
        await repository.InsertAsync(duplicate, CancellationToken.None);

        DateTimeOffset periodStart = DateTimeOffset.UtcNow.AddHours(-1);
        DateTimeOffset periodEnd = DateTimeOffset.UtcNow.AddHours(1);

        IReadOnlyList<UsageEvent> rows =
            await repository.ListAsync(tenantId, periodStart, periodEnd, UsageMeterKind.ApiRequest, 10, CancellationToken.None);

        rows.Should().ContainSingle(e => e.IdempotencyKey == idempotencyKey);
    }

    [SkippableFact]
    public async Task InsertBatchAsync_same_idempotency_key_inserts_once()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperUsageEventRepository repository = new(connectionFactory);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        string idempotencyKey = $"batch:{Guid.NewGuid():N}";

        UsageEvent first = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey
        };

        UsageEvent duplicate = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey
        };

        await repository.InsertBatchAsync([first, duplicate], CancellationToken.None);

        DateTimeOffset periodStart = DateTimeOffset.UtcNow.AddHours(-1);
        DateTimeOffset periodEnd = DateTimeOffset.UtcNow.AddHours(1);

        IReadOnlyList<UsageEvent> rows =
            await repository.ListAsync(tenantId, periodStart, periodEnd, UsageMeterKind.ApiRequest, 10, CancellationToken.None);

        rows.Should().ContainSingle(e => e.IdempotencyKey == idempotencyKey);
    }

    [SkippableFact]
    public async Task Api_request_events_with_shared_correlation_are_distinct_and_replays_are_deduplicated()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperUsageEventRepository repository = new(connectionFactory);
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTimeOffset recordedUtc = DateTimeOffset.UtcNow;
        const string correlationId = "shared-correlation";

        UsageEvent CreateEvent(Guid id) => new()
        {
            Id = id,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = recordedUtc,
            CorrelationId = correlationId,
            IdempotencyKey = UsageEventIdempotencyKeys.ForApiRequest(id)
        };

        UsageEvent first = CreateEvent(Guid.NewGuid());
        UsageEvent second = CreateEvent(Guid.NewGuid());

        // Both same-batch duplicates and a replay after commit must be harmless.
        await repository.InsertBatchAsync([first, second, first], CancellationToken.None);
        await repository.InsertBatchAsync([first, second], CancellationToken.None);
        await repository.InsertAsync(first, CancellationToken.None);

        DateTimeOffset periodStart = recordedUtc.AddHours(-1);
        DateTimeOffset periodEnd = recordedUtc.AddHours(1);
        IReadOnlyList<UsageEvent> rows = await repository.ListAsync(
            tenantId, periodStart, periodEnd, UsageMeterKind.ApiRequest, 10, CancellationToken.None);

        rows.Should().HaveCount(2);
        rows.Select(e => e.Id).Should().BeEquivalentTo(new[] { first.Id, second.Id });
        rows.Select(e => e.IdempotencyKey).Should().BeEquivalentTo(new[] { first.IdempotencyKey, second.IdempotencyKey });
        rows.Should().OnlyContain(e => e.CorrelationId == correlationId && e.Quantity == 1);
        IReadOnlyList<TenantUsageSummary> totals = await repository.AggregateByKindAsync(
            tenantId, periodStart, periodEnd, CancellationToken.None);
        totals.Should().ContainSingle(e => e.Kind == UsageMeterKind.ApiRequest && e.TotalQuantity == 2);
    }
}
