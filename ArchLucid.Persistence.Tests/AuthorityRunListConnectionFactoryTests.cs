using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="ReadReplicaRoutedConnectionFactory" /> for <see cref="ReadReplicaQueryRoute.AuthorityRunList" /> opens
///     via <see cref="ResilientSqlConnectionFactory" /> when no replica string is set.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AuthorityRunListConnectionFactoryTests
{
    [Theory]
    [InlineData(ReadReplicaQueryRoute.AuthorityRunList, SqlTopologyMode.SystemWithPerTenantCatalogs)]
    [InlineData(ReadReplicaQueryRoute.GovernanceResolution, SqlTopologyMode.SystemWithPerTenantCatalogs)]
    [InlineData(ReadReplicaQueryRoute.GoldenManifestLookup, SqlTopologyMode.SystemWithPerTenantCatalogs)]
    [InlineData(ReadReplicaQueryRoute.AuthorityRunList, SqlTopologyMode.SingleCatalog)]
    public async Task Shared_replica_failover_requires_single_catalog_topology(
        ReadReplicaQueryRoute route,
        SqlTopologyMode mode)
    {
        TimeoutException primaryFailure = new("Tenant SQL connection timed out.");
        Mock<ISqlConnectionFactory> primary = new();
        primary.Setup(factory => factory.CreateOpenConnectionAsync(CancellationToken.None)).ThrowsAsync(primaryFailure);
        Mock<IOptionsMonitor<SqlServerOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new SqlServerOptions
        {
            ReadReplica = new SqlReadReplicaSettings
            {
                // If fallback constructs this shared connection, parsing fails before any network access.
                FailoverGroupReadOnlyListenerConnectionString = "UnsupportedTestKeyword=shared",
            },
        });

        Mock<IOptionsMonitor<SqlTopologyOptions>> topology = new();
        topology.Setup(monitor => monitor.CurrentValue).Returns(new SqlTopologyOptions { Mode = mode });

        ReadReplicaRoutedConnectionFactory sut = new(
            primary.Object,
            options.Object,
            topology.Object,
            route,
            Microsoft.Extensions.Options.Options.Create(new SqlOpenResilienceOptions { MaxRetryAttempts = 1 }),
            NullLogger<ReadReplicaRoutedConnectionFactory>.Instance);

        Func<Task> open = () => sut.CreateOpenConnectionAsync(CancellationToken.None);
        if (mode == SqlTopologyMode.SingleCatalog)
            await open.Should().ThrowAsync<ArgumentException>().WithMessage("*unsupportedtestkeyword*");
        else
            (await open.Should().ThrowAsync<TimeoutException>()).Which.Should().BeSameAs(primaryFailure);
    }

    [SkippableFact]
    public async Task CreateOpenConnectionAsync_WithoutReplica_Uses_resilient_factory()
    {
        Mock<ISqlConnectionFactory> inner = new();
        SqlConnection expected = new();
        inner.Setup(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        ResilientSqlConnectionFactory resilient = new(
            inner.Object,
            SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(maxRetryAttempts: 1));

        Mock<IOptionsMonitor<SqlServerOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new SqlServerOptions());

        Mock<IOptionsMonitor<SqlTopologyOptions>> topology = new();
        topology.Setup(monitor => monitor.CurrentValue).Returns(new SqlTopologyOptions());

        ReadReplicaRoutedConnectionFactory sut = new(
            resilient,
            options.Object,
            topology.Object,
            ReadReplicaQueryRoute.AuthorityRunList,
            Microsoft.Extensions.Options.Options.Create(new SqlOpenResilienceOptions { MaxRetryAttempts = 1 }),
            NullLogger<ReadReplicaRoutedConnectionFactory>.Instance);

        SqlConnection actual = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        actual.Should().BeSameAs(expected);
        inner.Verify(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
