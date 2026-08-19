using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Identity;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IdentityClaimRoleMappingValidatorTests
{
    [Fact]
    public void Evaluate_fails_when_role_claim_name_missing()
    {
        IdentityClaimRoleMappingDocument mapping = new()
        {
            RoleClaimName = string.Empty,
            Mappings =
            [
                new IdentityClaimRoleMappingEntry { IdpValue = "grp-admin", ArchLucidRole = ArchLucidRoles.Admin }
            ]
        };

        IReadOnlyList<SamlTestConfigComponentResult> results = IdentityClaimRoleMappingValidator.Evaluate(mapping);

        results.Should().Contain(static r =>
            r.Component == "claimMapping.roleClaimName" && r.Status == SamlTestConfigComponentStatus.Fail);
    }

    [Fact]
    public void Evaluate_fails_for_unsupported_archlucid_role()
    {
        IdentityClaimRoleMappingDocument mapping = new()
        {
            RoleClaimName = "groups",
            Mappings =
            [
                new IdentityClaimRoleMappingEntry { IdpValue = "grp-super", ArchLucidRole = "SuperUser" }
            ]
        };

        IReadOnlyList<SamlTestConfigComponentResult> results = IdentityClaimRoleMappingValidator.Evaluate(mapping);

        results.Should().Contain(static r => r.Status == SamlTestConfigComponentStatus.Fail);
    }

    [Fact]
    public void ValidateOrThrow_passes_for_valid_mapping()
    {
        IdentityClaimRoleMappingDocument mapping = new()
        {
            RoleClaimName = "groups",
            Mappings =
            [
                new IdentityClaimRoleMappingEntry { IdpValue = "grp-admin", ArchLucidRole = ArchLucidRoles.Admin }
            ]
        };

        Action act = () => IdentityClaimRoleMappingValidator.ValidateOrThrow(mapping);

        act.Should().NotThrow();
    }
}
