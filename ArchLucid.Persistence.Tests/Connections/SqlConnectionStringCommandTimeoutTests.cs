using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlConnectionStringCommandTimeoutTests
{
    [Fact]
    public void Apply_SetsCommandTimeout()
    {
        const string connectionString =
            "Server=localhost;Database=ArchLucid;User Id=sa;Password=x;TrustServerCertificate=True;";

        string timed = SqlConnectionStringCommandTimeout.Apply(connectionString, 600);

        SqlConnectionStringBuilder builder = new(timed);
        builder.CommandTimeout.Should().Be(600);
        builder.InitialCatalog.Should().Be("ArchLucid");
    }

    [Fact]
    public void Apply_Throws_WhenTimeoutNegative()
    {
        Action act = () => SqlConnectionStringCommandTimeout.Apply("Server=localhost;Database=ArchLucid;", -1);

        act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("timeoutSeconds");
    }

    [Fact]
    public void Apply_Throws_WhenConnectionStringBlank()
    {
        Action act = () => SqlConnectionStringCommandTimeout.Apply("  ", 30);

        act.Should().Throw<ArgumentException>().WithParameterName("connectionString");
    }
}
