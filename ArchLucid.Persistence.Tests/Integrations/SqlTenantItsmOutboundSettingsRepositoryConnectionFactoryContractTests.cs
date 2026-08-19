using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Persistence.Tests.Integrations;

/// <summary>
///     Guards TB-867 / PD-002: settings must bind the tenant-scoped SQL factory, not the primary-catalog worker factory.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlTenantItsmOutboundSettingsRepositoryConnectionFactoryContractTests
{
    [Fact]
    public void Constructor_requires_tenant_scoped_sql_factory_not_background_worker_factory()
    {
        System.Reflection.ConstructorInfo ctor =
            typeof(SqlTenantItsmOutboundSettingsRepository).GetConstructors().Single();

        Type[] parameterTypes = ctor.GetParameters().Select(parameter => parameter.ParameterType).ToArray();

        parameterTypes.Should().Contain(typeof(ISqlConnectionFactory));
        parameterTypes.Should().NotContain(typeof(IBackgroundWorkerSqlConnectionFactory));
    }
}
