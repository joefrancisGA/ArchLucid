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
}
