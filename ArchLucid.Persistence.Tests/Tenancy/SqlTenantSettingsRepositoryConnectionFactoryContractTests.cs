using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Persistence.Tests.Tenancy;

/// <summary>
///     Guards tenant-plane settings against the primary-catalog worker factory (same class as TB-867 / PD-002).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlTenantSettingsRepositoryConnectionFactoryContractTests
{
    [Fact]
    public void Constructor_requires_tenant_scoped_sql_factory_not_background_worker_factory()
    {
        System.Reflection.ConstructorInfo ctor =
            typeof(SqlTenantSettingsRepository).GetConstructors().Single();

        Type[] parameterTypes = ctor.GetParameters().Select(parameter => parameter.ParameterType).ToArray();

        parameterTypes.Should().Contain(typeof(ISqlConnectionFactory));
        parameterTypes.Should().NotContain(typeof(IBackgroundWorkerSqlConnectionFactory));
    }
}
