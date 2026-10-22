using System.Data;

using ArchLucid.Host.Core.DataAccess;
using ArchLucid.Persistence.Connections;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="SqlScopedResolutionDbConnectionFactory" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlScopedResolutionDbConnectionFactoryTests
{
    [SkippableFact]
    public async Task CreateOpenConnectionAsync_resolves_ISqlConnectionFactory_from_scope()
    {
        SqlConnection expected = new();
        Mock<ISqlConnectionFactory> sql = new();
        sql.Setup(s => s.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        ServiceCollection services = [];
        services.AddScoped(_ => sql.Object);
        ServiceProvider provider = services.BuildServiceProvider();

        SqlScopedResolutionDbConnectionFactory sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            "Server=(localdb)\\mssqllocaldb;Database=master;Trusted_Connection=True;TrustServerCertificate=True",
            CreateOptionsMonitor(new SqlServerOptions()));

        IDbConnection conn = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        conn.Should().BeSameAs(expected);
    }

    [SkippableFact]
    public void CreateConnection_returns_unopened_SqlConnection()
    {
        ServiceCollection services = [];
        services.AddScoped<ISqlConnectionFactory>(_ => Mock.Of<ISqlConnectionFactory>());
        ServiceProvider provider = services.BuildServiceProvider();

        const string cs =
            "Server=(localdb)\\mssqllocaldb;Database=master;Trusted_Connection=True;TrustServerCertificate=True";
        SqlScopedResolutionDbConnectionFactory sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            cs,
            CreateOptionsMonitor(new SqlServerOptions { CommandTimeoutSeconds = 45 }));

        IDbConnection conn = sut.CreateConnection();

        conn.Should().BeOfType<SqlConnection>();
        SqlConnection sqlConn = (SqlConnection)conn;
        sqlConn.CommandTimeout.Should().Be(45);
        conn.State.Should().Be(ConnectionState.Closed);
    }

    /// <summary>
    ///     Product SQL composition registers scoped <see cref="ResilientSqlConnectionFactory" /> as
    ///     <see cref="ISqlConnectionFactory" /> — this verifies the singleton bridge participates in Polly-backed opens.
    /// </summary>
    [SkippableFact]
    public async Task CreateOpenConnectionAsync_with_ResilientSqlConnectionFactory_retries_transient_sql_error()
    {
        SqlConnection expected = new();
        Mock<ISqlConnectionFactory> inner = new();
        int callCount = 0;

        inner.Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).Returns<CancellationToken>(_ =>
        {
            callCount++;

            if (callCount == 1)
                throw SqlExceptionTestFactory.Create(40613);

            return Task.FromResult(expected);
        });

        ResilientSqlConnectionFactory resilient = new(
            inner.Object,
            SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                NullLogger<ResilientSqlConnectionFactory>.Instance,
                maxRetryAttempts: 3,
                baseDelay: TimeSpan.FromMilliseconds(1)));

        ServiceCollection services = [];
        services.AddScoped<ISqlConnectionFactory>(_ => resilient);
        ServiceProvider provider = services.BuildServiceProvider();

        SqlScopedResolutionDbConnectionFactory sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            "Server=(localdb)\\mssqllocaldb;Database=master;Trusted_Connection=True;TrustServerCertificate=True",
            CreateOptionsMonitor(new SqlServerOptions()));

        IDbConnection conn = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        conn.Should().BeSameAs(expected);
        callCount.Should().Be(2);
    }

    private static IOptionsMonitor<SqlServerOptions> CreateOptionsMonitor(SqlServerOptions options)
    {
        Mock<IOptionsMonitor<SqlServerOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);
        monitor.Setup(m => m.Get(It.IsAny<string>())).Returns(options);

        return monitor.Object;
    }
}
