using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Api.Auth.Services;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
public sealed class RecentAuthenticationEvaluatorTests
{
    [Fact]
    public void HasRecentAuthentication_returns_true_for_fresh_auth_time()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        long authTime = now.ToUnixTimeSeconds();

        ClaimsPrincipal principal = new(
            new ClaimsIdentity(
            [
                new Claim("auth_time", authTime.ToString())
            ],
            "Bearer"));

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_for_stale_auth_time()
    {
        long authTime = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeSeconds();

        ClaimsPrincipal principal = new(
            new ClaimsIdentity(
            [
                new Claim("auth_time", authTime.ToString())
            ],
            "Bearer"));

        Assert.False(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_for_future_auth_time()
    {
        long authTime = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();

        ClaimsPrincipal principal = new(
            new ClaimsIdentity(
            [
                new Claim("auth_time", authTime.ToString())
            ],
            "Bearer"));

        Assert.False(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_a_later_auth_time_claim_is_parseable_even_if_first_is_garbage()
    {
        long fresh = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("auth_time", "not-a-number"));
        identity.AddClaim(new Claim("auth_time", fresh.ToString()));

        ClaimsPrincipal principal = new(identity);

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_every_auth_time_claim_is_unparseable_even_with_fresh_iat()
    {
        long iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("auth_time", "garbage-one"));
        identity.AddClaim(new Claim("auth_time", "garbage-two"));
        identity.AddClaim(new Claim("iat", iat.ToString()));

        ClaimsPrincipal principal = new(identity);

        Assert.False(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_latest_auth_time_is_fresh_among_multiple_values()
    {
        long stale = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeSeconds();
        long fresh = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("auth_time", stale.ToString()));
        identity.AddClaim(new Claim("auth_time", fresh.ToString()));

        ClaimsPrincipal principal = new(identity);

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_later_iat_is_fresh_among_multiple_values_without_auth_time()
    {
        long stale = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeSeconds();
        long fresh = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Iat, stale.ToString()));
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Iat, fresh.ToString()));

        ClaimsPrincipal principal = new(identity);

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_auth_time_is_present_but_unparseable()
    {
        long iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsPrincipal principal = new(
            new ClaimsIdentity(
            [
                new Claim("auth_time", "not-a-number"),
                new Claim("iat", iat.ToString()),
            ],
            "Bearer"));

        Assert.False(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_auth_time_uses_integer64_value_type_on_cookie_principal()
    {
        long epoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("auth_time", epoch.ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer64));

        ClaimsPrincipal principal = new(identity);

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }

    [Fact]
    public void TryGetAuthenticationInstant_parses_integer64_auth_time_without_falling_back_to_iat()
    {
        long staleIat = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeSeconds();
        long freshAuthTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim("auth_time", freshAuthTime.ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer64));
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Iat, staleIat.ToString()));

        DateTimeOffset? instant = RecentAuthenticationEvaluator.TryGetAuthenticationInstant(new ClaimsPrincipal(identity));

        Assert.NotNull(instant);
        Assert.Equal(freshAuthTime, instant.Value.ToUnixTimeSeconds());
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_for_trial_jwt_auth_time_shape_after_jwt_serialization_round_trip()
    {
        long epoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        JwtSecurityToken token = new(
            "https://issuer.test",
            "api://test",
            [
                new Claim("auth_time", epoch.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                new Claim(
                    JwtRegisteredClaimNames.Iat,
                    epoch.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    ClaimValueTypes.Integer64),
            ]);

        JwtSecurityTokenHandler handler = new();
        JwtSecurityToken roundTripped = handler.ReadJwtToken(handler.WriteToken(token));
        ClaimsPrincipal principal = new(new ClaimsIdentity(roundTripped.Claims, "Bearer"));

        Assert.True(RecentAuthenticationEvaluator.HasRecentAuthentication(principal, TimeProvider.System));
    }
}
