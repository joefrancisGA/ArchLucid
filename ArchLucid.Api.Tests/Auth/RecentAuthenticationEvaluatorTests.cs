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
    public void HasRecentAuthentication_returns_true_when_a_later_parseable_iat_claim_is_used_even_if_first_is_garbage_without_auth_time()
    {
        long fresh = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        ClaimsIdentity identity = new("Bearer");
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Iat, "garbage"));
        identity.AddClaim(new Claim(JwtRegisteredClaimNames.Iat, fresh.ToString(System.Globalization.CultureInfo.InvariantCulture)));

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
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
    public void HasRecentAuthentication_clamps_max_age_minutes_above_sixty_to_sixty()
    {
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        long authTime = now.AddMinutes(-90).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTime.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System,
                maxAgeMinutes: 120));
    }

    [Fact]
    public void HasRecentAuthentication_clamps_max_age_minutes_below_one_to_one_minute()
    {
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        long authTime = now.AddSeconds(-30).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTime.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            "Bearer");

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System,
                maxAgeMinutes: 0));
    }

    [Fact]
    public void HasRecentAuthentication_clamps_negative_max_age_minutes_to_one()
    {
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        long authTime = now.AddSeconds(-30).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTime.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            "Bearer");

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System,
                maxAgeMinutes: -5));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_auth_time_is_one_second_past_max_age_boundary()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        long authTime = now.AddMinutes(-maxAgeMinutes).AddSeconds(-1).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTime.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System,
                maxAgeMinutes));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_stale_iat_is_present_without_auth_time()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long staleIat = now.AddMinutes(-(maxAgeMinutes + 1)).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, staleIat.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock,
                maxAgeMinutes));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_only_fresh_iat_is_present_without_auth_time()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long freshIat = now.AddMinutes(-(maxAgeMinutes - 1)).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, freshIat.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            ],
            "Bearer");

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock,
                maxAgeMinutes));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_only_iat_is_exactly_at_max_age_boundary_without_auth_time()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long iat = now.AddMinutes(-maxAgeMinutes).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, iat.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            ],
            "Bearer");

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock,
                maxAgeMinutes));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_iat_is_one_second_past_max_age_boundary_without_auth_time()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long staleIat = now.AddMinutes(-maxAgeMinutes).AddSeconds(-1).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, staleIat.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock,
                maxAgeMinutes));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_future_iat_is_present_without_auth_time()
    {
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long futureIat = now.AddHours(1).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, futureIat.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_unparseable_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, "not-a-number"),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_empty_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, string.Empty),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_whitespace_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, "   "),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_negative_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, "-1"),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_fractional_string_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, "1700000000.5"),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_false_when_only_hex_string_iat_is_present_without_auth_time()
    {
        ClaimsIdentity identity = new(
            [
                new Claim(JwtRegisteredClaimNames.Iat, "0x5f5e100"),
            ],
            "Bearer");

        Assert.False(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                TimeProvider.System));
    }

    [Fact]
    public void HasRecentAuthentication_returns_true_when_auth_time_is_exactly_at_max_age_boundary()
    {
        const int maxAgeMinutes = 15;
        DateTimeOffset now = new(2026, 6, 1, 12, 0, 0, TimeSpan.Zero);
        FixedUtcTimeProvider clock = new(now);
        long authTime = now.AddMinutes(-maxAgeMinutes).ToUnixTimeSeconds();

        ClaimsIdentity identity = new(
            [new Claim("auth_time", authTime.ToString(System.Globalization.CultureInfo.InvariantCulture))],
            "Bearer");

        Assert.True(
            RecentAuthenticationEvaluator.HasRecentAuthentication(
                new ClaimsPrincipal(identity),
                clock,
                maxAgeMinutes));
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

    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
