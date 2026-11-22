using ArchLucid.Core.AwsExtractor;
using ArchLucid.Persistence.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.AwsExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantAwsConnectionRepositoryTests
{
    [Fact]
    public async Task Repeated_account_registration_preserves_connection_identity_and_creation_time()
    {
        InMemoryTenantAwsConnectionRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid originalId = Guid.NewGuid();
        DateTimeOffset createdUtc = new(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);

        await sut.UpsertAsync(new TenantAwsConnectionRecord
        {
            ConnectionId = originalId,
            TenantId = tenantId,
            AccountId = "123456789012",
            Region = "us-east-1",
            RoleArn = "arn:aws:iam::123456789012:role/Original",
            Status = AwsConnectionStatus.Connected,
            CreatedUtc = createdUtc,
            UpdatedByActorId = "first"
        }, CancellationToken.None);

        // A second caller may have looked up the account before the first registration.
        await sut.UpsertAsync(new TenantAwsConnectionRecord
        {
            TenantId = tenantId,
            AccountId = " 123456789012 ",
            Region = "us-west-2",
            RoleArn = "arn:aws:iam::123456789012:role/Updated",
            Status = AwsConnectionStatus.Connected,
            CreatedUtc = createdUtc.AddDays(1),
            UpdatedByActorId = "second"
        }, CancellationToken.None);

        TenantAwsConnectionRecord stored =
            (await sut.ListByTenantAsync(tenantId, CancellationToken.None)).Should().ContainSingle().Subject;
        stored.ConnectionId.Should().Be(originalId);
        stored.CreatedUtc.Should().Be(createdUtc);
        stored.Region.Should().Be("us-west-2");
        (await sut.TryGetByAccountAsync(tenantId, "123456789012", CancellationToken.None))!.ConnectionId
            .Should().Be(originalId);
    }

    [Fact]
    public async Task Upsert_get_list_update_and_delete_round_trip()
    {
        InMemoryTenantAwsConnectionRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        DateTimeOffset created = TimeProvider.System.GetUtcNow().AddHours(-1);

        await sut.UpsertAsync(
            new TenantAwsConnectionRecord
            {
                ConnectionId = connectionId,
                TenantId = tenantA,
                AccountId = " 123456789012 ",
                Region = " us-east-1 ",
                RoleArn = " arn:aws:iam::123456789012:role/ArchLucid ",
                Status = AwsConnectionStatus.Connected,
                CreatedUtc = created,
                UpdatedByActorId = "actor-1",
            },
            CancellationToken.None);

        await sut.UpsertAsync(
            new TenantAwsConnectionRecord
            {
                TenantId = tenantB,
                AccountId = "999999999999",
                Region = "eu-west-1",
                RoleArn = "arn:aws:iam::999999999999:role/Other",
                Status = AwsConnectionStatus.Disconnected,
                UpdatedByActorId = "actor-2",
            },
            CancellationToken.None);

        TenantAwsConnectionRecord? byId = await sut.TryGetAsync(tenantA, connectionId, CancellationToken.None);
        byId.Should().NotBeNull();
        byId!.AccountId.Should().Be("123456789012");
        byId.Region.Should().Be("us-east-1");
        byId.RoleArn.Should().Be("arn:aws:iam::123456789012:role/ArchLucid");

        (await sut.TryGetByAccountAsync(tenantA, "123456789012", CancellationToken.None))!.ConnectionId
            .Should()
            .Be(connectionId);
        (await sut.TryGetByAccountAsync(tenantA, "missing", CancellationToken.None)).Should().BeNull();
        (await sut.TryGetAsync(tenantB, connectionId, CancellationToken.None)).Should().BeNull();

        (await sut.ListByTenantAsync(tenantA, CancellationToken.None)).Should().ContainSingle();
        (await sut.ListActiveConnectionsAsync(CancellationToken.None))
            .Should()
            .ContainSingle(r => r.TenantId == tenantA);

        await sut.UpdateStatusAsync(
            tenantA,
            connectionId,
            AwsConnectionStatus.Error,
            lastPolledUtc: created.AddMinutes(5),
            updatedByActorId: "actor-3",
            CancellationToken.None);
        await sut.UpdateStatusAsync(
            tenantA,
            Guid.NewGuid(),
            AwsConnectionStatus.Connected,
            null,
            "noop",
            CancellationToken.None);

        (await sut.TryGetAsync(tenantA, connectionId, CancellationToken.None))!.Status
            .Should()
            .Be(AwsConnectionStatus.Error);

        await sut.DeleteAsync(tenantA, connectionId, CancellationToken.None);
        (await sut.TryGetByAccountAsync(tenantA, "123456789012", CancellationToken.None)).Should().BeNull();
        (await sut.ListByTenantAsync(tenantA, CancellationToken.None)).Should().BeEmpty();
    }
}
