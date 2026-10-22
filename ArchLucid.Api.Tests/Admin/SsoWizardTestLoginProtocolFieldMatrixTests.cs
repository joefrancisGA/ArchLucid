using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>
///     Sandbox test-login does not carry SAML metadata or OIDC Key Vault secret names; protocol-specific persisted fields apply only to activation.
/// </summary>
[Trait("Suite", "Core")]
public sealed class SsoWizardTestLoginProtocolFieldMatrixTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("d1000000-0000-0000-0000-000000000001"),
        WorkspaceId = Guid.Parse("d2000000-0000-0000-0000-000000000001"),
        ProjectId = Guid.Parse("d3000000-0000-0000-0000-000000000001"),
    };

    [Theory]
    [InlineData("oidc")]
    [InlineData("saml")]
    public void TestLogin_matrix_does_not_require_protocol_persisted_fields_on_request(string protocol)
    {
        SsoWizardTestLoginService sut = new();

        IdentityProviderTestLoginResponse response = sut.Execute(
            new IdentityProviderTestLoginRequest
            {
                Protocol = protocol,
                IssuerUri = "https://idp.example/",
                ClaimMapping = ValidClaimMapping(),
                SampleClaimValues = ["al-admins"],
            },
            Scope);

        response.Success.Should().BeTrue();
        response.MappedRoles.Should().Contain("Admin");
    }

    [Fact]
    public void TestLogin_request_does_not_expose_activation_protocol_persisted_fields()
    {
        typeof(IdentityProviderTestLoginRequest).GetProperty("MetadataXml").Should().BeNull();
        typeof(IdentityProviderTestLoginRequest).GetProperty("KeyVaultSecretName").Should().BeNull();
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
