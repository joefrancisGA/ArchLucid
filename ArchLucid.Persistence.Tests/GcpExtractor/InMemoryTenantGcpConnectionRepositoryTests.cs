using ArchLucid.Core.GcpExtractor;
using ArchLucid.Persistence.GcpExtractor;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.GcpExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryTenantGcpConnectionRepositoryTests
{
    [Fact]
    public async Task Upsert_get_list_update_and_delete_round_trip()
    {
        InMemoryTenantGcpConnectionRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        DateTimeOffset created = TimeProvider.System.GetUtcNow().AddHours(-2);

        await sut.UpsertAsync(
            new TenantGcpConnectionRecord
            {
                ConnectionId = connectionId,
                TenantId = tenantA,
                ProjectId = " my-project ",
                WorkloadIdentityPoolProvider = " projects/1/locations/global/workloadIdentityPools/p/providers/x ",
                ServiceAccountEmail = " sa@my-project.iam.gserviceaccount.com ",
                Status = GcpConnectionStatus.Connected,
                CreatedUtc = created,
                UpdatedByActorId = "actor-1",
            },
            CancellationToken.None);

        await sut.UpsertAsync(
            new TenantGcpConnectionRecord
            {
                TenantId = tenantB,
                ProjectId = "other-project",
                WorkloadIdentityPoolProvider = "projects/2/locations/global/workloadIdentityPools/p/providers/y",
                ServiceAccountEmail = "sa@other.iam.gserviceaccount.com",
                Status = GcpConnectionStatus.Disconnected,
                UpdatedByActorId = "actor-2",
            },
            CancellationToken.None);

        TenantGcpConnectionRecord? byId = await sut.TryGetAsync(tenantA, connectionId, CancellationToken.None);
        byId.Should().NotBeNull();
        byId!.ProjectId.Should().Be("my-project");
        byId.ServiceAccountEmail.Should().Be("sa@my-project.iam.gserviceaccount.com");

        (await sut.TryGetByProjectAsync(tenantA, "my-project", CancellationToken.None))!.ConnectionId
            .Should()
            .Be(connectionId);
        (await sut.TryGetByProjectAsync(tenantA, "missing", CancellationToken.None)).Should().BeNull();

        (await sut.ListByTenantAsync(tenantA, CancellationToken.None)).Should().ContainSingle();
        (await sut.ListActiveConnectionsAsync(CancellationToken.None))
            .Should()
            .ContainSingle(r => r.TenantId == tenantA);

        await sut.UpdateStatusAsync(
            tenantA,
            connectionId,
            GcpConnectionStatus.Error,
            lastPolledUtc: created.AddMinutes(3),
            updatedByActorId: "actor-3",
            CancellationToken.None);
        await sut.UpdateStatusAsync(
            tenantA,
            Guid.NewGuid(),
            GcpConnectionStatus.Connected,
            null,
            "noop",
            CancellationToken.None);

        (await sut.TryGetAsync(tenantA, connectionId, CancellationToken.None))!.Status
            .Should()
            .Be(GcpConnectionStatus.Error);

        await sut.DeleteAsync(tenantA, connectionId, CancellationToken.None);
        (await sut.TryGetByProjectAsync(tenantA, "my-project", CancellationToken.None)).Should().BeNull();
        (await sut.ListByTenantAsync(tenantA, CancellationToken.None)).Should().BeEmpty();
    }
}
