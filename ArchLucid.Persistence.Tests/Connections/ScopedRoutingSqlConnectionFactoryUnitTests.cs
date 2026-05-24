using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopedRoutingSqlConnectionFactoryUnitTests
{
    [Fact]
    public async Task CreateOpenConnectionAsync_when_tenant_scope_resolves_control_plane_catalog_throws_TenantIsolationException()
    {
        const string sharedCatalogConnectionString =
            "Server=localhost;Database=ArchLucidSystem;Encrypt=True;TrustServerCertificate=True";

        Guid tenantId = Guid.NewGuid();
        Mock<ITenantDatabaseResolver> resolver = new();
        resolver.Setup(r => r.ResolveTenantConnectionStringAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sharedCatalogConnectionString);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ISystemSqlConnectionFactory> systemFactory = new();
        systemFactory.Setup(f => f.SystemConnectionString).Returns(sharedCatalogConnectionString);

        IOptionsMonitor<SqlTopologyOptions> topology = new StaticTopologyMonitor(
            new SqlTopologyOptions { Mode = SqlTopologyMode.SystemWithPerTenantCatalogs });

        ScopedRoutingSqlConnectionFactory sut = new(
            sharedCatalogConnectionString,
            systemFactory.Object,
            resolver.Object,
            scope.Object,
            topology);

        Func<Task> act = () => sut.CreateOpenConnectionAsync(CancellationToken.None);

        await act.Should()
            .ThrowAsync<TenantIsolationException>()
            .WithMessage("*control-plane catalog*");
    }

    private sealed class StaticTopologyMonitor(SqlTopologyOptions value) : IOptionsMonitor<SqlTopologyOptions>
    {
        public SqlTopologyOptions CurrentValue { get; } = value ?? throw new ArgumentNullException(nameof(value));

        public SqlTopologyOptions Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<SqlTopologyOptions, string?> listener) => new EmptyDisposable();
    }

    private sealed class EmptyDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
