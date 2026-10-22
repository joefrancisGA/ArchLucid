using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class NoOpTenantSqlCatalogProvisionerTests
{
    [Fact]
    public async Task ProvisionTenantCatalogAsync_completes_without_side_effects()
    {
        NoOpTenantSqlCatalogProvisioner sut = new();

        Func<Task> act = async () =>
            await sut.ProvisionTenantCatalogAsync(
                Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "tenant-aaaa",
                CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
