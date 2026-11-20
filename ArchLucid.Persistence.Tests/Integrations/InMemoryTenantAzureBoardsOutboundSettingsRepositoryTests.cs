using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantAzureBoardsOutboundSettingsRepositoryTests
{
    [Fact]
    public async Task UpsertAsync_preserves_connection_test_when_saving_defaults()
    {
        InMemoryTenantAzureBoardsOutboundSettingsRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTime testedUtc = new(2026, 11, 19, 12, 0, 0, DateTimeKind.Utc);

        await repository.UpsertAsync(tenantId, new() { ProjectName = "Original" }, CancellationToken.None);
        await repository.UpdateConnectionTestAsync(tenantId, testedUtc, "Connected", CancellationToken.None);
        TenantAzureBoardsOutboundSettings saved =
            await repository.UpsertAsync(tenantId, new() { ProjectName = "Updated" }, CancellationToken.None);

        saved.ProjectName.Should().Be("Updated");
        saved.LastConnectionTestUtc.Should().Be(testedUtc);
        saved.LastConnectionTestSummary.Should().Be("Connected");
    }
}
