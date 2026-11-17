using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlArchitectureProjectRetentionPurgeServiceTests
{
    [Fact]
    public async Task PurgeExpiredAsync_checks_later_tenants_when_one_catalog_cannot_be_opened()
    {
        TenantRecord first = new() { Id = Guid.NewGuid(), Name = "first-test-tenant" };
        TenantRecord second = new() { Id = Guid.NewGuid(), Name = "second-test-tenant" };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(CancellationToken.None)).ReturnsAsync([first, second]);

        Mock<ITenantDatabaseResolver> resolver = new(MockBehavior.Strict);
        resolver.Setup(r => r.ResolveTenantConnectionStringAsync(first.Id, CancellationToken.None))
            .ReturnsAsync("invalid connection string");
        resolver.Setup(r => r.ResolveTenantConnectionStringAsync(second.Id, CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("No catalog in this unit test."));

        SqlArchitectureProjectRetentionPurgeService purge = CreateService(tenants.Object, resolver.Object);

        (await purge.PurgeExpiredAsync(DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeEmpty();
        resolver.Verify(r => r.ResolveTenantConnectionStringAsync(second.Id, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task PurgeExpiredAsync_preserves_requested_cancellation_while_resolving_a_catalog()
    {
        TenantRecord tenant = new() { Id = Guid.NewGuid(), Name = "canceled-test-tenant" };
        using CancellationTokenSource cancellation = new();
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(cancellation.Token)).ReturnsAsync([tenant]);
        Mock<ITenantDatabaseResolver> resolver = new(MockBehavior.Strict);
        resolver.Setup(r => r.ResolveTenantConnectionStringAsync(tenant.Id, cancellation.Token))
            .Returns(() =>
            {
                cancellation.Cancel();
                return Task.FromCanceled<string>(cancellation.Token);
            });

        SqlArchitectureProjectRetentionPurgeService purge = CreateService(tenants.Object, resolver.Object);
        Func<Task> run = () => purge.PurgeExpiredAsync(DateTimeOffset.UtcNow, cancellation.Token);

        await run.Should().ThrowAsync<OperationCanceledException>();
    }

    private static SqlArchitectureProjectRetentionPurgeService CreateService(
        ITenantRepository tenants,
        ITenantDatabaseResolver resolver) =>
        new(
            Mock.Of<ISqlConnectionFactory>(MockBehavior.Strict),
            tenants,
            resolver,
            new FixedOptionsMonitor<SqlTopologyOptions>(new() { Mode = SqlTopologyMode.SystemWithPerTenantCatalogs }),
            NullLogger<SqlArchitectureProjectRetentionPurgeService>.Instance);
}
