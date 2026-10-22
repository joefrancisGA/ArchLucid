using ArchLucid.Api.Security;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests.Security;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ApiPathSkipSafetyTests
{
    [Theory]
    [InlineData("/health/live/../v1/runs")]
    [InlineData("/health//live")]
    [InlineData("/health\\live")]
    [InlineData("/v1/register/%2e%2e/admin")]
    [InlineData("/v1/register/%2E%2E/admin")]
    [InlineData("/openapi/%2e/segment")]
    public void BlocksPathBasedSkip_returns_true_for_traversal_shaped_paths(string path)
    {
        ApiPathSkipSafety.BlocksPathBasedSkip(path).Should().BeTrue();
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/v1/register")]
    [InlineData("/openapi/v1.json")]
    public void BlocksPathBasedSkip_returns_false_for_normal_paths(string path)
    {
        ApiPathSkipSafety.BlocksPathBasedSkip(path).Should().BeFalse();
    }

    [Fact]
    public void SafeStartsWithSegments_returns_false_when_path_is_blocked()
    {
        PathString path = new("/scim/../v1/runs");

        ApiPathSkipSafety.SafeStartsWithSegments(path, "/scim").Should().BeFalse();
    }
}
