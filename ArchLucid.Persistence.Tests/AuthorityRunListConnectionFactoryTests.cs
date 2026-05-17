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

        ReadReplicaRoutedConnectionFactory sut = new(
            resilient,
            options.Object,
            ReadReplicaQueryRoute.AuthorityRunList,
            Microsoft.Extensions.Options.Options.Create(new SqlOpenResilienceOptions { MaxRetryAttempts = 1 }),
            NullLogger<ReadReplicaRoutedConnectionFactory>.Instance);

        SqlConnection actual = await sut.CreateOpenConnectionAsync(CancellationToken.None);

        actual.Should().BeSameAs(expected);
        inner.Verify(p => p.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
