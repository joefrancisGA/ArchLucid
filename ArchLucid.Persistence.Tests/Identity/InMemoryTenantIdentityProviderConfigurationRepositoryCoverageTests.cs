using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryTenantIdentityProviderConfigurationRepositoryCoverageTests
{
    [Fact]
    public async Task UpsertAsync_last_writer_wins_for_same_tenant()
    {
        InMemoryTenantIdentityProviderConfigurationRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        await sut.UpsertAsync(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Oidc,
                IssuerUri = "https://old.example/",
                ClaimMappingJson = "{}",
                UpdatedUtc = now,
                UpdatedByActorId = "first",
                IsActive = true,
            },
            CancellationToken.None);

        await sut.UpsertAsync(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Oidc,
                IssuerUri = "https://new.example/",
                ClaimMappingJson = "{\"sub\":\"id\"}",
                UpdatedUtc = now.AddMinutes(1),
                UpdatedByActorId = "second",
                IsActive = true,
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord? loaded =
            await sut.TryGetAsync(tenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.IssuerUri.Should().Be("https://new.example/");
        loaded.UpdatedByActorId.Should().Be("second");
    }
}
