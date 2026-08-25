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

    [Fact]
    public async Task ActivateAsync_reactivate_preserves_key_vault_secret_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        IdentityClaimRoleMappingRequest mapping = new()
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
        };

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = mapping,
                KeyVaultSecretName = "tenant-idp-client-secret"
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/v2/",
                ClaimMapping = mapping
            },
            CancellationToken.None);

        record.KeyVaultSecretName.Should().Be("tenant-idp-client-secret");

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded!.KeyVaultSecretName.Should().Be("tenant-idp-client-secret");
    }

    [Fact]
    public async Task ActivateAsync_reactivate_preserves_metadata_xml_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        const string metadataXml = "<EntityDescriptor entityID=\"https://idp.example/saml\" />";
        IdentityClaimRoleMappingRequest mapping = new()
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
        };

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "saml",
                IssuerUri = "https://idp.example/saml",
                ClaimMapping = mapping,
                MetadataXml = metadataXml
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "saml",
                IssuerUri = "https://idp.example/saml",
                ClaimMapping = mapping
            },
            CancellationToken.None);

        record.MetadataXml.Should().Be(metadataXml);

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded!.MetadataXml.Should().Be(metadataXml);
    }

    [Fact]
    public async Task ActivateAsync_protocol_switch_clears_saml_metadata_xml_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        const string metadataXml = "<EntityDescriptor entityID=\"https://idp.example/saml\" />";
        IdentityClaimRoleMappingRequest mapping = new()
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
        };

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "saml",
                IssuerUri = "https://idp.example/saml",
                ClaimMapping = mapping,
                MetadataXml = metadataXml
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/oidc",
                ClaimMapping = mapping
            },
            CancellationToken.None);

        record.Protocol.Should().Be(TenantIdentityProtocol.Oidc);
        record.MetadataXml.Should().BeNull();

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded!.MetadataXml.Should().BeNull();
    }

    [Fact]
    public async Task ActivateAsync_protocol_switch_clears_oidc_key_vault_secret_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        IdentityClaimRoleMappingRequest mapping = new()
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
        };

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = mapping,
                KeyVaultSecretName = "tenant-idp-client-secret"
            },
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "saml",
                IssuerUri = "https://idp.example/saml",
                ClaimMapping = mapping
            },
            CancellationToken.None);

        record.Protocol.Should().Be(TenantIdentityProtocol.Saml);
        record.KeyVaultSecretName.Should().BeNull();

        TenantIdentityProviderConfigurationRecord? loaded =
            await repository.TryGetAsync(tenantId, CancellationToken.None);

        loaded!.KeyVaultSecretName.Should().BeNull();
    }

    [Theory]
    [InlineData("file:///etc/passwd")]
    [InlineData("javascript:alert('xss')")]
    public async Task ActivateAsync_rejects_non_http_scheme_issuer_uri(string issuerUri)
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);

        Func<Task> act = () => sut.ActivateAsync(
            Guid.Parse("55555555-5555-5555-5555-555555555555"),
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = issuerUri,
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

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*HTTP(S)*");
    }

    [Theory]
    [InlineData("https://")]
    [InlineData("http://")]
    public async Task ActivateAsync_rejects_issuer_without_host(string issuerUri)
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);

        Func<Task> act = () => sut.ActivateAsync(
            Guid.Parse("88888888-8888-8888-8888-888888888888"),
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = issuerUri,
                ClaimMapping = ValidClaimMapping()
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*HTTP(S)*");
    }

    [Fact]
    public async Task ActivateAsync_rejects_empty_role_claim_name()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);

        Func<Task> act = () => sut.ActivateAsync(
            Guid.Parse("99999999-9999-9999-9999-999999999999"),
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = new IdentityClaimRoleMappingRequest
                {
                    RoleClaimName = "   ",
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

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*RoleClaimName*");
    }

    [Fact]
    public async Task ActivateAsync_null_claim_mapping_entries_throw_argument_null_exception()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);

        Func<Task> act = () => sut.ActivateAsync(
            Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            "admin@test",
            new IdentityProviderActivateRequest
            {
                Protocol = "oidc",
                IssuerUri = "https://idp.example/",
                ClaimMapping = new IdentityClaimRoleMappingRequest
                {
                    RoleClaimName = "groups",
                    Mappings = null!
                }
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    private static IdentityClaimRoleMappingRequest ValidClaimMapping() => new()
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
    };
}
