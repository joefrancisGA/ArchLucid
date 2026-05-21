using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
public sealed class SsoWizardTestLoginServiceTests
{
    [Fact]
    public void Execute_maps_sample_claim_values_to_archlucid_roles()
    {
        SsoWizardTestLoginService sut = new();
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject
        };

        IdentityProviderTestLoginResponse response = sut.Execute(
            new IdentityProviderTestLoginRequest
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
                },
                SampleClaimValues = ["al-admins"]
            },
            scope);

        response.Success.Should().BeTrue();
        response.MappedRoles.Should().Contain("Admin");
        response.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Execute_returns_failure_when_no_roles_mapped()
    {
        SsoWizardTestLoginService sut = new();
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject
        };

        IdentityProviderTestLoginResponse response = sut.Execute(
            new IdentityProviderTestLoginRequest
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
                },
                SampleClaimValues = ["unknown-group"]
            },
            scope);

        response.Success.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("No ArchLucid roles");
    }
}
