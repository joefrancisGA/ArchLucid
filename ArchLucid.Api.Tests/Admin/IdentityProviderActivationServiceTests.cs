using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
public sealed class IdentityProviderActivationServiceTests
{
    [Fact]
    public async Task ActivateAsync_persists_active_tenant_configuration()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = new IdentityClaimRoleMappingRequest
                {
                    RoleClaimName = "groups",
                    Mappings =
                    [
                        new IdentityClaimRoleMappingEntryRequest
                        {
                            IdpValue = "al-admins",
                            ArchLucidRole = "Admin"
                        }
                    ]
                }
            },
            CancellationToken.None);

        record.IsActive.Should().BeTrue();
        record.IssuerUri.Should().Be("https://idp.example/");

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(record.TenantId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ClaimMappingJson.Should().Contain("al-admins");
    }
}
