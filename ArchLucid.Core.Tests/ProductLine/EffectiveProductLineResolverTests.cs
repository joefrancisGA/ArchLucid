using ArchLucid.Core.ProductLine;

using FluentAssertions;

namespace ArchLucid.Core.Tests.ProductLine;

public sealed class EffectiveProductLineResolverTests
{
    [Theory]
    [InlineData(ProductLineDeploymentKind.Both, null, EffectiveProductLineKind.Both)]
    [InlineData(ProductLineDeploymentKind.Both, "", EffectiveProductLineKind.Both)]
    [InlineData(ProductLineDeploymentKind.Both, "security", EffectiveProductLineKind.Security)]
    [InlineData(ProductLineDeploymentKind.Both, "architecture", EffectiveProductLineKind.Architecture)]
    [InlineData(ProductLineDeploymentKind.Security, null, EffectiveProductLineKind.Security)]
    [InlineData(ProductLineDeploymentKind.Security, "architecture", EffectiveProductLineKind.Security)]
    [InlineData(ProductLineDeploymentKind.Architecture, null, EffectiveProductLineKind.Architecture)]
    [InlineData(ProductLineDeploymentKind.Architecture, "security", EffectiveProductLineKind.Architecture)]
    public void Resolve_maps_deployment_and_header_matrix(
        ProductLineDeploymentKind deployment,
        string? header,
        EffectiveProductLineKind expected)
    {
        EffectiveProductLineResolver.Resolve(deployment, header).Should().Be(expected);
    }

    [Fact]
    public void Resolve_ignores_invalid_header()
    {
        EffectiveProductLineResolver.Resolve(ProductLineDeploymentKind.Both, "invalid")
            .Should().Be(EffectiveProductLineKind.Both);
    }

    [Fact]
    public void TryParseRequestHeader_accepts_case_insensitive_values()
    {
        EffectiveProductLineResolver.TryParseRequestHeader("SECURITY", out ProductLineId line).Should().BeTrue();
        line.Should().Be(ProductLineId.Security);
    }
}
