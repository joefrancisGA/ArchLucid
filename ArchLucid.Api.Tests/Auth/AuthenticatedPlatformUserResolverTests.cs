using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class AuthenticatedPlatformUserResolverTests
{
    [Fact]
    public async Task ResolveAsync_returns_null_when_find_first_sub_is_opaque_even_if_later_sub_is_platform_user_guid()
    {
        InMemoryPlatformUserRepository users = new();
        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "User", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Sub, "opaque-subject"));
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString("D")));

        AuthenticatedPlatformUserResolver sut = new(users);

        PlatformUserRecord? resolved = await sut.ResolveAsync(new ClaimsPrincipal(identity), CancellationToken.None);

        resolved.Should().BeNull(
            "FindFirst binds the opaque subject; signed platform-user JWTs do not surface attacker-controlled duplicate sub claims before validation.");
    }
}
