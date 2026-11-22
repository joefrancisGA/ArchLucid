using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperDigestSubscriptionRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ListEnabledByScopeAsync_includes_routes_beyond_the_admin_list_cap()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        DapperDigestSubscriptionRepository repository = new(new SqlConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime firstCreatedUtc = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);

        DigestSubscription NewSubscription(Guid project, DateTime createdUtc, bool enabled = true) => new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = project,
            ChannelType = "email",
            Destination = "route@example.test",
            IsEnabled = enabled,
            CreatedUtc = createdUtc,
        };

        DigestSubscription oldestRoute = NewSubscription(projectId, firstCreatedUtc);
        await repository.CreateAsync(oldestRoute, CancellationToken.None);
        for (int i = 1; i <= 200; i++)
            await repository.CreateAsync(NewSubscription(projectId, firstCreatedUtc.AddMinutes(i)), CancellationToken.None);

        await repository.CreateAsync(NewSubscription(projectId, firstCreatedUtc.AddHours(5), enabled: false), CancellationToken.None);
        await repository.CreateAsync(NewSubscription(Guid.NewGuid(), firstCreatedUtc.AddHours(6)), CancellationToken.None);

        IReadOnlyList<DigestSubscription> enabled = await repository.ListEnabledByScopeAsync(
            tenantId, workspaceId, projectId, CancellationToken.None);
        Assert.Equal(201, enabled.Count);
        Assert.Equal(oldestRoute.SubscriptionId, enabled[^1].SubscriptionId);
        Assert.All(enabled, route =>
        {
            Assert.True(route.IsEnabled);
            Assert.Equal(projectId, route.ProjectId);
        });

        IReadOnlyList<DigestSubscription> adminList = await repository.ListByScopeAsync(
            tenantId, workspaceId, projectId, CancellationToken.None);
        Assert.Equal(200, adminList.Count);
    }
}
