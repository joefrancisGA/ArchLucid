using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Application.Authorization;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class CustomRoleClaimsTransformationTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ScimUserAId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ScimUserBId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private const string DirectoryOid = "directory-oid-a";
    private const string PairwiseSub = "pairwise-sub-b";

    [Fact]
    public async Task TransformAsync_prefers_oid_over_sub_when_resolving_scim_user()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext { TenantId = TenantId });

        Mock<IScimUserRepository> scimUsers = new();
        scimUsers
            .Setup(r => r.GetByExternalIdAsync(TenantId, DirectoryOid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateScimUser(ScimUserAId, DirectoryOid));
        scimUsers
            .Setup(r => r.GetByExternalIdAsync(TenantId, PairwiseSub, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateScimUser(ScimUserBId, PairwiseSub));

        Mock<ICustomRolePermissionEvaluator> permissionEvaluator = new();
        permissionEvaluator
            .Setup(e => e.GetEffectivePermissionsAsync(TenantId, ScimUserAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<string>());
        permissionEvaluator
            .Setup(e => e.GetEffectivePermissionsAsync(TenantId, ScimUserBId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["tenant.custom.admin"]);

        CustomRoleClaimsTransformation transformation = new(
            scopeProvider.Object,
            scimUsers.Object,
            permissionEvaluator.Object);

        ClaimsPrincipal principal = new(
            new ClaimsIdentity(
            [
                new Claim("tenant_id", TenantId.ToString("D")),
                new Claim("oid", DirectoryOid),
                new Claim("sub", PairwiseSub),
            ],
            "Bearer",
            "name",
            "role"));

        ClaimsPrincipal transformed = await transformation.TransformAsync(principal);

        transformed.HasClaim(Permissions.ClaimType, "tenant.custom.admin").Should().BeFalse();
        permissionEvaluator.Verify(
            e => e.GetEffectivePermissionsAsync(TenantId, ScimUserAId, It.IsAny<CancellationToken>()),
            Times.Once);
        permissionEvaluator.Verify(
            e => e.GetEffectivePermissionsAsync(TenantId, ScimUserBId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ScimUserRecord CreateScimUser(Guid id, string externalId) =>
        new()
        {
            Id = id,
            TenantId = TenantId,
            ExternalId = externalId,
            UserName = externalId,
            DisplayName = externalId,
        };
}
