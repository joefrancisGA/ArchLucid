using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class AzureArchitectureIconCatalogTests
{
    private readonly AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", null, "virtual-machine.png")]
    [InlineData("microsoft.network/loadbalancers", null, "load-balancer.png")]
    [InlineData("Microsoft.Web/sites", null, "app-service.png")]
    [InlineData("Microsoft.Web/sites", "functionapp", "function-app.png")]
    [InlineData("Microsoft.EventGrid/topics", null, "event-grid-topics.png")]
    [InlineData("Microsoft.EventGrid/systemTopics", null, "event-grid-topics.png")]
    [InlineData("Microsoft.EventGrid/domains", null, "event-grid-domains.png")]
    public void Resolve_matches_exact_arm_type_and_kind(
        string armType,
        string? resourceKind,
        string expectedFile)
    {
        AzureArchitectureIconCatalogEntry? result = catalog.Resolve(armType, resourceKind);

        result.Should().NotBeNull();
        result!.File.Should().Be(expectedFile);
        result.DataUri.Should().StartWith("data:image/png;base64,");
    }

    [Fact]
    public void Resolve_returns_null_for_unknown_or_ambiguous_kind()
    {
        catalog.Resolve("Microsoft.Compute/galleries").Should().BeNull();
        catalog.Resolve("Microsoft.Network/virtualNetworks/subnets").Should().BeNull();
        catalog.Resolve("Microsoft.Web/sites", "app").Should().BeNull();
    }
}
