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
}
