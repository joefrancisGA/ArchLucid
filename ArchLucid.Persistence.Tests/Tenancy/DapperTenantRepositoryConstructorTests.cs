using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;
[Trait("Category", "Unit")]

/// <summary>
///     Guards primary-constructor null validation for <see cref="DapperTenantRepository" /> (no SQL).
/// </summary>
public sealed class DapperTenantRepositoryConstructorTests
{
    [Fact]
    public void Ctor_throws_when_catalogConnectionFactory_null()
    {
        Action act = () => _ = new DapperTenantRepository(
            null!,
            Mock.Of<ISqlConnectionFactory>(),
            Mock.Of<IOptionsMonitor<SqlTopologyOptions>>(),
            Mock.Of<ITenantDatabaseBindingRepository>(),
            Mock.Of<ITenantDatabaseResolver>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("catalogConnectionFactory");
    }

    [Fact]
    public void Ctor_throws_when_tenantPlaneConnectionFactory_null()
    {
        Action act = () => _ = new DapperTenantRepository(
            Mock.Of<ISystemSqlConnectionFactory>(),
            null!,
            Mock.Of<IOptionsMonitor<SqlTopologyOptions>>(),
            Mock.Of<ITenantDatabaseBindingRepository>(),
            Mock.Of<ITenantDatabaseResolver>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("tenantPlaneConnectionFactory");
    }

    [Fact]
    public void Ctor_throws_when_topologyOptions_null()
    {
        Action act = () => _ = new DapperTenantRepository(
            Mock.Of<ISystemSqlConnectionFactory>(),
            Mock.Of<ISqlConnectionFactory>(),
            null!,
            Mock.Of<ITenantDatabaseBindingRepository>(),
            Mock.Of<ITenantDatabaseResolver>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("topologyOptions");
    }

    [Fact]
    public void Ctor_throws_when_tenantDatabaseBindingRepository_null()
    {
        Action act = () => _ = new DapperTenantRepository(
            Mock.Of<ISystemSqlConnectionFactory>(),
            Mock.Of<ISqlConnectionFactory>(),
            Mock.Of<IOptionsMonitor<SqlTopologyOptions>>(),
            null!,
            Mock.Of<ITenantDatabaseResolver>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("tenantDatabaseBindingRepository");
    }

    [Fact]
    public void Ctor_throws_when_tenantDatabaseResolver_null()
    {
        Action act = () => _ = new DapperTenantRepository(
            Mock.Of<ISystemSqlConnectionFactory>(),
            Mock.Of<ISqlConnectionFactory>(),
            Mock.Of<IOptionsMonitor<SqlTopologyOptions>>(),
            Mock.Of<ITenantDatabaseBindingRepository>(),
            null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("tenantDatabaseResolver");
    }
}
