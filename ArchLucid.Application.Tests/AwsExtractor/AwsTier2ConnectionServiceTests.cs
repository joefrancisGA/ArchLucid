using ArchLucid.Application.AwsExtractor;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Persistence.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsTier2ConnectionServiceTests
{
    [Fact]
    public async Task ConfigureAsync_persists_connection_and_lists_it()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantAwsConnectionRepository repository = new();
        AwsTier2ConnectionService sut = new(repository);

        AwsTier2ConnectionSummary saved = await sut.ConfigureAsync(
            tenantId,
            "actor",
            new AwsTier2ConnectionConfigureRequest
            {
                AccountId = "123456789012",
                Region = "us-west-2",
                RoleArn = "arn:aws:iam::123456789012:role/ArchLucidReadOnly"
            },
            CancellationToken.None);

        saved.AccountId.Should().Be("123456789012");
        saved.Region.Should().Be("us-west-2");
        saved.Status.Should().Be(AwsConnectionStatus.Connected);

        IReadOnlyList<AwsTier2ConnectionSummary> listed = await sut.ListConnectionsAsync(tenantId, CancellationToken.None);
        listed.Should().ContainSingle(item => item.ConnectionId == saved.ConnectionId);
    }

    [Fact]
    public async Task DisconnectAsync_removes_connection()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantAwsConnectionRepository repository = new();
        AwsTier2ConnectionService sut = new(repository);

        AwsTier2ConnectionSummary saved = await sut.ConfigureAsync(
            tenantId,
            "actor",
            new AwsTier2ConnectionConfigureRequest
            {
                AccountId = "123456789012",
                Region = "eu-central-1",
                RoleArn = "arn:aws:iam::123456789012:role/ReadOnly"
            },
            CancellationToken.None);

        await sut.DisconnectAsync(tenantId, saved.ConnectionId, "actor", CancellationToken.None);

        IReadOnlyList<AwsTier2ConnectionSummary> listed = await sut.ListConnectionsAsync(tenantId, CancellationToken.None);
        listed.Should().BeEmpty();
    }
}
