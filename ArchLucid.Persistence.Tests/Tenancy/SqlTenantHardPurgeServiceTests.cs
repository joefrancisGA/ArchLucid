using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Tenancy;

public sealed class SqlTenantHardPurgeServiceTests
{
    [Fact]
    public void Ctor_throws_when_connection_factory_null()
    {
        Action act = () => _ = new SqlTenantHardPurgeService(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("connectionFactory");
    }

    [Fact]
    public async Task PurgeTenantAsync_throws_ArgumentNullException_when_options_null()
    {
        SqlTenantHardPurgeService sut = new(Mock.Of<ISqlConnectionFactory>());

        Func<Task> act = async () =>
            await sut.PurgeTenantAsync(Guid.NewGuid(), null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("options");
    }

    [Fact]
    public void BuildPurgeSql_Returns_parameterized_delete_for_allowlisted_table()
    {
        string sql = SqlTenantHardPurgeService.BuildPurgeSql("dbo.UsageEvents");

        sql.Should()
            .Be("DELETE TOP (@Cap) FROM dbo.UsageEvents WHERE TenantId = @TenantId");
    }

    [Fact]
    public void BuildPurgeSql_Throws_InvalidOperationException_when_table_not_allowlisted()
    {
        Action act = () => SqlTenantHardPurgeService.BuildPurgeSql("dbo.Injected; DROP TABLE dbo.Tenants;--");

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*not in the approved tenant-scoped purge list*");
    }

    [Fact]
    public void BuildPurgeSql_Throws_ArgumentNullException_when_table_null()
    {
        Action act = () => SqlTenantHardPurgeService.BuildPurgeSql(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("table");
    }
}
