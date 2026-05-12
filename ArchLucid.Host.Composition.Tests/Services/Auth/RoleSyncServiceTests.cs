using System.Security.Claims;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Host.Core.Auth.Services;

using ArchLucid.Persistence.Scim;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.Services.Auth;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RoleSyncServiceTests
{
    [Fact]
    public void TryDirectoryObjectKey_prefers_short_oid_over_long_objectidentifier()
    {
        ClaimsIdentity id = new("test", "name", "role");
        id.AddClaim(new Claim("oid", "short-oid"));
        id.AddClaim(new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", "long-oid"));

        RoleSyncService.TryDirectoryObjectKey(new ClaimsPrincipal(id)).Should().Be("short-oid");
    }

    [Fact]
    public void TryDirectoryObjectKey_falls_back_to_objectidentifier_when_oid_absent()
    {
        ClaimsIdentity id = new("test", "name", "role");
        id.AddClaim(new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", "only-long"));

        RoleSyncService.TryDirectoryObjectKey(new ClaimsPrincipal(id)).Should().Be("only-long");
    }

    [Fact]
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync_without_tenant_id_leaves_role_claims()
    {
        InMemoryScimUserRepository repo = new();
        RoleSyncService sut = new(repo);
        ClaimsIdentity id = new("test", "name", "role");
        id.AddClaim(new Claim("roles", ArchLucidRoles.Admin));
        ClaimsPrincipal p = new(id);

        await sut.ApplyEntraJwtAndDirectoryOverridesAsync(p, CancellationToken.None);

        p.FindAll("roles").Select(c => c.Value).Should().ContainSingle().Which.Should().Be(ArchLucidRoles.Admin);
    }

    [Fact]
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync_manual_scim_role_replaces_jwt_app_roles()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        InMemoryScimUserRepository repo = new();
        await repo.InsertAsync(
            tenantId,
            "entra-object-id-1",
            "pat@example.com",
            null,
            true,
            ArchLucidRoles.Reader,
            ScimResolvedRoleOrigin.Manual,
            CancellationToken.None);

        RoleSyncService sut = new(repo);
        ClaimsIdentity id = new("test", "name", "role");
        id.AddClaim(new Claim("tenant_id", tenantId.ToString("D")));
        id.AddClaim(new Claim("oid", "entra-object-id-1"));
        id.AddClaim(new Claim("roles", ArchLucidRoles.Admin));
        id.AddClaim(new Claim(ClaimTypes.Role, ArchLucidRoles.Admin));
        ClaimsPrincipal p = new(id);

        await sut.ApplyEntraJwtAndDirectoryOverridesAsync(p, CancellationToken.None);

        HashSet<string> roles = new(StringComparer.OrdinalIgnoreCase);

        foreach (Claim c in p.FindAll("roles"))
            roles.Add(c.Value);

        foreach (Claim c in p.FindAll(ClaimTypes.Role))
            roles.Add(c.Value);

        roles.Should().BeEquivalentTo([ArchLucidRoles.Reader]);
    }
}
