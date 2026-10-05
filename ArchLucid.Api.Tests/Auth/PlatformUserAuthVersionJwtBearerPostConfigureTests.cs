using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class PlatformUserAuthVersionJwtBearerPostConfigureTests
{
    [Fact]
    public async Task OnTokenValidated_fails_when_first_sub_is_platform_user_without_auth_version_claim()
    {
        InMemoryPlatformUserRepository users = new();
        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "User", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        await using ServiceProvider sp = BuildServiceProvider(users);
        JwtBearerOptions options = WirePostConfigure(sp);

        TokenValidatedContext ctx = CreateContext(
            new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString("D")),
                new Claim(JwtRegisteredClaimNames.Iss, "https://issuer.test"),
            ],
            "Bearer"));

        await options.Events!.OnTokenValidated(ctx);

        ctx.Result?.Failure?.Message.Should().Contain("no longer valid");
    }

    [Fact]
    public async Task OnTokenValidated_uses_find_first_sub_so_opaque_leading_sub_skips_auth_version_even_with_later_platform_user_sub()
    {
        Guid platformUserId = Guid.NewGuid();

        await using ServiceProvider sp = BuildServiceProvider(new InMemoryPlatformUserRepository());
        JwtBearerOptions options = WirePostConfigure(sp);

        TokenValidatedContext ctx = CreateContext(
            new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, "opaque-ci-subject"),
                new Claim(JwtRegisteredClaimNames.Sub, platformUserId.ToString("D")),
                new Claim(JwtRegisteredClaimNames.Iss, "https://issuer.test"),
            ],
            "Bearer"));

        await options.Events!.OnTokenValidated(ctx);

        ctx.Result?.Failure.Should().BeNull(
            "ValidateAsync skips non-Guid subjects; JwtBearer rejects duplicate sub payloads before this hook on signed platform-user JWTs.");
    }

    private static ServiceProvider BuildServiceProvider(IPlatformUserRepository users)
    {
        ServiceCollection services = new();
        services.AddSingleton(users);
        services.AddSingleton(
            Options.Create(
                new TrialAuthOptions
                {
                    LocalIdentity = new TrialLocalIdentityOptions { JwtIssuer = "https://issuer.test" }
                }));
        services.AddSingleton(
            Options.Create(new ArchLucid.Api.Auth.Models.ArchLucidAuthOptions()));
        services.AddSingleton<PlatformUserAuthVersionValidator>();
        services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>, PlatformUserAuthVersionJwtBearerPostConfigure>();
        return services.BuildServiceProvider();
    }

    private static JwtBearerOptions WirePostConfigure(ServiceProvider sp)
    {
        JwtBearerOptions options = new();
        sp.GetRequiredService<IPostConfigureOptions<JwtBearerOptions>>().PostConfigure(null, options);
        return options;
    }

    private static TokenValidatedContext CreateContext(ClaimsIdentity identity)
    {
        DefaultHttpContext http = new();
        AuthenticationScheme scheme = new(
            JwtBearerDefaults.AuthenticationScheme,
            "JWT Bearer",
            typeof(JwtBearerHandler));

        return new TokenValidatedContext(http, scheme, new JwtBearerOptions())
        {
            Principal = new ClaimsPrincipal(identity)
        };
    }
}
