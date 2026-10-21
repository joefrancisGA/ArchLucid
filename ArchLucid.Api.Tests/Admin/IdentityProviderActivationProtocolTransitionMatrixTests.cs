using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>
///     Activation matrix for protocol-specific persisted fields across greenfield, same-protocol, and cross-protocol transitions.
/// </summary>
[Trait("Suite", "Core")]
public sealed class IdentityProviderActivationProtocolTransitionMatrixTests
{
    private const string ValidSamlMetadataXml = """
        <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                          entityID="https://idp.example/saml">
          <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
        </EntityDescriptor>
        """;

    private const string KeyVaultSecret = "tenant-idp-client-secret";

    [Theory]
    [InlineData(null, TenantIdentityProtocol.Saml, true)]
    [InlineData(TenantIdentityProtocol.Oidc, TenantIdentityProtocol.Saml, true)]
    [InlineData(TenantIdentityProtocol.Saml, TenantIdentityProtocol.Saml, true)]
    [InlineData(TenantIdentityProtocol.Oidc, TenantIdentityProtocol.Oidc, false)]
    [InlineData(null, TenantIdentityProtocol.Oidc, false)]
    public void RequiresSubstantiveSamlMetadataXml_matches_transition_matrix(
        TenantIdentityProtocol? existingProtocol,
        TenantIdentityProtocol targetProtocol,
        bool expected)
    {
        TenantIdentityProviderConfigurationRecord? existing = existingProtocol is null
            ? null
            : new TenantIdentityProviderConfigurationRecord
            {
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Protocol = existingProtocol.Value,
                IssuerUri = "https://idp.example/",
                ClaimMappingJson = """{"roleClaimName":"groups","mappings":[]}""",
                UpdatedByActorId = "admin@test",
                IsActive = true,
            };

        bool actual = IdentityProviderActivationProtocolFieldRequirements.RequiresSubstantiveSamlMetadataXml(
            existing,
            targetProtocol);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null, TenantIdentityProtocol.Oidc, false)]
    [InlineData(TenantIdentityProtocol.Oidc, TenantIdentityProtocol.Oidc, false)]
    [InlineData(TenantIdentityProtocol.Saml, TenantIdentityProtocol.Oidc, true)]
    [InlineData(TenantIdentityProtocol.Saml, TenantIdentityProtocol.Saml, false)]
    public void RequiresSubstantiveOidcKeyVaultSecretName_matches_transition_matrix(
        TenantIdentityProtocol? existingProtocol,
        TenantIdentityProtocol targetProtocol,
        bool expected)
    {
        TenantIdentityProviderConfigurationRecord? existing = existingProtocol is null
            ? null
            : new TenantIdentityProviderConfigurationRecord
            {
                TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Protocol = existingProtocol.Value,
                IssuerUri = "https://idp.example/",
                ClaimMappingJson = """{"roleClaimName":"groups","mappings":[]}""",
                UpdatedByActorId = "admin@test",
                IsActive = true,
            };

        bool actual =
            IdentityProviderActivationProtocolFieldRequirements.RequiresSubstantiveOidcKeyVaultSecretName(
                existing,
                targetProtocol);

        actual.Should().Be(expected);
    }

    [Fact]
    public async Task ActivateAsync_matrix_greenfield_oidc_without_key_vault_secret_succeeds()
    {
        IdentityProviderActivationService sut = new(new InMemoryTenantIdentityProviderConfigurationRepository());

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            Guid.Parse("c1000000-0000-0000-0000-000000000001"),
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        record.Protocol.Should().Be(TenantIdentityProtocol.Oidc);
        record.KeyVaultSecretName.Should().BeNull();
    }

    [Fact]
    public async Task ActivateAsync_matrix_greenfield_saml_without_metadata_fails()
    {
        IdentityProviderActivationService sut = new(new InMemoryTenantIdentityProviderConfigurationRepository());

        Func<Task> act = () => sut.ActivateAsync(
            Guid.Parse("c1000000-0000-0000-0000-000000000002"),
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*MetadataXml*");
    }

    [Fact]
    public async Task ActivateAsync_matrix_same_protocol_oidc_reactivate_preserves_key_vault_secret_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("c1000000-0000-0000-0000-000000000003");

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: true),
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        record.KeyVaultSecretName.Should().Be(KeyVaultSecret);
    }

    [Fact]
    public async Task ActivateAsync_matrix_same_protocol_saml_reactivate_preserves_metadata_when_omitted()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("c1000000-0000-0000-0000-000000000004");

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: true, includeKeyVaultSecret: false),
            CancellationToken.None);

        TenantIdentityProviderConfigurationRecord record = await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        record.MetadataXml.Should().Be(ValidSamlMetadataXml);
    }

    [Fact]
    public async Task ActivateAsync_matrix_cross_protocol_oidc_to_saml_without_metadata_fails()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("c1000000-0000-0000-0000-000000000005");

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: true),
            CancellationToken.None);

        Func<Task> act = () => sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*MetadataXml*");
    }

    [Fact]
    public async Task ActivateAsync_matrix_cross_protocol_saml_to_oidc_without_key_vault_secret_fails()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("c1000000-0000-0000-0000-000000000006");

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: true, includeKeyVaultSecret: false),
            CancellationToken.None);

        Func<Task> act = () => sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*KeyVaultSecretName*");
    }

    [Fact]
    public async Task ActivateAsync_matrix_round_trip_saml_oidc_saml_requires_metadata_on_final_switch()
    {
        InMemoryTenantIdentityProviderConfigurationRepository repository = new();
        IdentityProviderActivationService sut = new(repository);
        Guid tenantId = Guid.Parse("c1000000-0000-0000-0000-000000000007");

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: true, includeKeyVaultSecret: false),
            CancellationToken.None);

        await sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("oidc", includeMetadata: false, includeKeyVaultSecret: true),
            CancellationToken.None);

        Func<Task> act = () => sut.ActivateAsync(
            tenantId,
            "admin@test",
            BuildActivateRequest("saml", includeMetadata: false, includeKeyVaultSecret: false),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*MetadataXml*");
    }

    private static IdentityProviderActivateRequest BuildActivateRequest(
        string protocol,
        bool includeMetadata,
        bool includeKeyVaultSecret)
    {
        return new IdentityProviderActivateRequest
        {
            Protocol = protocol,
            IssuerUri = protocol == "saml" ? "https://idp.example/saml" : "https://idp.example/",
            ClaimMapping = ValidClaimMapping(),
            MetadataXml = includeMetadata ? ValidSamlMetadataXml : null,
            KeyVaultSecretName = includeKeyVaultSecret ? KeyVaultSecret : null,
        };
    }

    private static IdentityClaimRoleMappingRequest ValidClaimMapping()
    {
        return new IdentityClaimRoleMappingRequest
        {
            RoleClaimName = "groups",
            Mappings =
            [
                new IdentityClaimRoleMappingEntryRequest
                {
                    IdpValue = "al-admins",
                    ArchLucidRole = "Admin",
                },
            ],
        };
    }
}
