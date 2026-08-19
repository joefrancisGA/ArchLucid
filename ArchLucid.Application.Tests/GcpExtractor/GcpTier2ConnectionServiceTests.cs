using ArchLucid.Application.GcpExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Persistence.GcpExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpTier2ConnectionServiceTests
{
    [Fact]
    public async Task ConfigureAsync_persists_connection_and_lists_it()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantGcpConnectionRepository repository = new();
        GcpTier2ConnectionService sut = new(repository);

        GcpTier2ConnectionSummary saved = await sut.ConfigureAsync(
            tenantId,
            "actor",
            new GcpTier2ConnectionConfigureRequest
            {
                ProjectId = "my-gcp-project",
                WorkloadIdentityPoolProvider = "projects/123/locations/global/workloadIdentityPools/pool/providers/azure",
                ServiceAccountEmail = "archlucid-readonly@my-gcp-project.iam.gserviceaccount.com"
            },
            CancellationToken.None);

        saved.ProjectId.Should().Be("my-gcp-project");
        saved.Status.Should().Be(GcpConnectionStatus.Connected);

        IReadOnlyList<GcpTier2ConnectionSummary> listed = await sut.ListConnectionsAsync(tenantId, CancellationToken.None);
        listed.Should().ContainSingle(item => item.ConnectionId == saved.ConnectionId);
    }

    [Fact]
    public async Task DisconnectAsync_removes_connection()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantGcpConnectionRepository repository = new();
        GcpTier2ConnectionService sut = new(repository);

        GcpTier2ConnectionSummary saved = await sut.ConfigureAsync(
            tenantId,
            "actor",
            new GcpTier2ConnectionConfigureRequest
            {
                ProjectId = "other-project",
                WorkloadIdentityPoolProvider = "projects/456/locations/global/workloadIdentityPools/pool/providers/azure",
                ServiceAccountEmail = "readonly@other-project.iam.gserviceaccount.com"
            },
            CancellationToken.None);

        await sut.DisconnectAsync(tenantId, saved.ConnectionId, "actor", CancellationToken.None);

        IReadOnlyList<GcpTier2ConnectionSummary> listed = await sut.ListConnectionsAsync(tenantId, CancellationToken.None);
        listed.Should().BeEmpty();
    }
}
