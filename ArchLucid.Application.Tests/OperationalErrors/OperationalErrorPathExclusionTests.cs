using ArchLucid.Application.OperationalErrors;

using FluentAssertions;

namespace ArchLucid.Application.Tests.OperationalErrors;

[Trait("Category", "Unit")]
public sealed class OperationalErrorPathExclusionTests
{
    [Theory]
    [InlineData("/health/ready", true)]
    [InlineData("/metrics", true)]
    [InlineData("/openapi/v1.json", true)]
    [InlineData("/v1/runs", false)]
    public void IsExcluded_matches_configured_prefixes(string path, bool expected)
    {
        string[] prefixes = ["/health", "/metrics", "/openapi", "/scalar"];

        OperationalErrorPathExclusion.IsExcluded(path, prefixes).Should().Be(expected);
    }
}
