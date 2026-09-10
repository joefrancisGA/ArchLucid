using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;

using FluentAssertions;

namespace ArchLucid.Core.Tests.ProductLine;

public sealed class ProductLineDeploymentOptionsTests
{
    [Theory]
    [InlineData("both", ProductLineDeploymentKind.Both)]
    [InlineData("architecture", ProductLineDeploymentKind.Architecture)]
    [InlineData("security", ProductLineDeploymentKind.Security)]
    public void TryParseDeploymentKind_parses_known_values(string raw, ProductLineDeploymentKind expected)
    {
        ProductLineDeploymentOptions.TryParseDeploymentKind(raw, out ProductLineDeploymentKind kind).Should().BeTrue();
        kind.Should().Be(expected);
    }

    [Fact]
    public void ResolveDeploymentKind_defaults_invalid_to_both()
    {
        ProductLineDeploymentOptions options = new() { Deployment = "not-a-line" };

        options.ResolveDeploymentKind().Should().Be(ProductLineDeploymentKind.Both);
    }
}
