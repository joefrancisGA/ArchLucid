using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Persistence.Tests.Integrations;

/// <summary>
///     Guards TB-1151 / PD-002 class: Azure Boards settings must bind the tenant-scoped SQL factory,
///     not the primary-catalog worker factory (parity with TB-867 ITSM settings).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlTenantAzureBoardsOutboundSettingsRepositoryConnectionFactoryContractTests
{
    [Fact]
    public void Constructor_requires_tenant_scoped_sql_factory_not_background_worker_factory()
    {
        System.Reflection.ConstructorInfo ctor =
            typeof(SqlTenantAzureBoardsOutboundSettingsRepository).GetConstructors().Single();

        Type[] parameterTypes = ctor.GetParameters().Select(parameter => parameter.ParameterType).ToArray();

        parameterTypes.Should().Contain(typeof(ISqlConnectionFactory));
        parameterTypes.Should().NotContain(typeof(IBackgroundWorkerSqlConnectionFactory));
    }
}
