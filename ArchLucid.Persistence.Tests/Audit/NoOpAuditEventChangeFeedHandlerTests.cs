using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Persistence.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class NoOpAuditEventChangeFeedHandlerTests
{
    [Fact]
    public async Task HandleAsync_completes_without_side_effects()
    {
        NoOpAuditEventChangeFeedHandler sut = new();

        Func<Task> act = async () =>
            await sut.HandleAsync(
                [new AuditEventDocument { Id = "evt-1", TenantId = Guid.NewGuid().ToString("D") }],
                CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
