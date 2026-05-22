using ArchLucid.Persistence.Connections;
using FluentAssertions;
using Microsoft.Data.SqlClient;
using Xunit;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlConnectionFactoryTests
{
    [Fact]
    public void Constructor_SetsCommandTimeoutTo30()
    {
        // Arrange
        string connectionString = "Server=tcp:example.database.windows.net,1433;Initial Catalog=db;Persist Security Info=False;User ID=user;Password=pass;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";

        // Act
        var factory = new SqlConnectionFactory(connectionString);

        // Assert
        // We can't directly read _connectionString, but we can create a connection and check its properties
        // Wait, SqlConnection doesn't expose CommandTimeout, SqlCommand does.
        // But SqlConnectionStringBuilder exposes CommandTimeout. Let's use reflection to get _connectionString.
        var field = typeof(SqlConnectionFactory).GetField("_connectionString", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        var actualConnectionString = (string)field!.GetValue(factory)!;

        var builder = new SqlConnectionStringBuilder(actualConnectionString);
        builder.CommandTimeout.Should().Be(30);
    }
}
