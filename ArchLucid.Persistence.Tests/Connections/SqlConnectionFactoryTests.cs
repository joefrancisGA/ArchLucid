using System.Reflection;

using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlConnectionFactoryTests
{
    [Fact]
    public void Constructor_SetsCommandTimeoutTo30()
    {
        // Arrange
        const string connectionString = "Server=tcp:example.database.windows.net,1433;Initial Catalog=db;Persist Security Info=False;User ID=user;Password=pass;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

        // Act
        SqlConnectionFactory factory = new(connectionString);

        // Assert
        // We can't directly read _connectionString, but we can create a connection and check its properties
        // Wait, SqlConnection doesn't expose CommandTimeout, SqlCommand does.
        // But SqlConnectionStringBuilder exposes CommandTimeout. Let's use reflection to get _connectionString.
        FieldInfo? field = typeof(SqlConnectionFactory).GetField("_connectionString", BindingFlags.NonPublic | BindingFlags.Instance);
        string actualConnectionString = (string)field!.GetValue(factory)!;

        SqlConnectionStringBuilder builder = new(actualConnectionString);
        builder.CommandTimeout.Should().Be(30);
    }
}
