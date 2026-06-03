using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.CustomerSuccess;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests.CustomerSuccess;

[Trait("Suite", "Persistence")]
[Trait("Category", "Unit")]
public sealed class SqlOperatorStickinessSnapshotReaderRlsTests
{
    [Fact]
    public void ToNullableUtcDateTime_ReturnsNull_WhenDbNull()
    {
        DateTime? result = SqlOperatorStickinessSnapshotReader.ToNullableUtcDateTimeForTests(DBNull.Value);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetOperatorSignalsAsync_AppliesRls()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IReadOnlyDbConnectionFactory> connectionFactory = new();
        Mock<IRlsSessionContextApplicator> applicator = new();

        connectionFactory
            .Setup(factory => factory.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=master;Integrated Security=True"));

        applicator
            .Setup(a => a.ApplyAsync(
                It.IsAny<SqlConnection>(),
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        SqlOperatorStickinessSnapshotReader reader = new(connectionFactory.Object, applicator.Object);

        try
        {
            await reader.GetOperatorSignalsAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        }
        catch
        {
            // Query fails without a live database; RLS application is verified below.
        }

        applicator.Verify(
            a => a.ApplyAsync(
                It.IsAny<SqlConnection>(),
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetFunnelSnapshotAsync_AppliesRls()
    {
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        Guid workspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        Guid projectId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        Mock<IReadOnlyDbConnectionFactory> connectionFactory = new();
        Mock<IRlsSessionContextApplicator> applicator = new();

        connectionFactory
            .Setup(factory => factory.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=master;Integrated Security=True"));

        applicator
            .Setup(a => a.ApplyAsync(
                It.IsAny<SqlConnection>(),
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        SqlOperatorStickinessSnapshotReader reader = new(connectionFactory.Object, applicator.Object);

        try
        {
            await reader.GetFunnelSnapshotAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        }
        catch
        {
            // Query fails without a live database; RLS application is verified below.
        }

        applicator.Verify(
            a => a.ApplyAsync(
                It.IsAny<SqlConnection>(),
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
