using System.Reflection;
using System.Security.Cryptography;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.Core.Diagrams;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class AzureArchitectureIconCatalogTests
{
    private readonly AzureArchitectureIconCatalog catalog = AzureArchitectureIconCatalog.Load();

    [Fact]
    public void Palette_edge_strokes_match_drr_tokens()
    {
        ArchitectureDiagramMermaidPalette.LightEdgeStroke.Should().Be("#111827");
        ArchitectureDiagramMermaidPalette.DarkEdgeStroke.Should().Be("#e2e8f0");
    }

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
        catalog.Resolve("Microsoft.ContainerInstance/containerGroups").Should().BeNull();
        catalog.Resolve("Microsoft.EventGrid/eventSubscriptions").Should().BeNull();
        catalog.Resolve("Microsoft.Cdn/profiles").Should().BeNull();
    }

    [Fact]
    public void Embedded_icon_pngs_have_unique_sha256_hashes()
    {
        Assembly assembly = typeof(AzureArchitectureIconCatalog).Assembly;
        HashSet<string> seenHashes = new(StringComparer.Ordinal);

        foreach (string resourceName in assembly.GetManifestResourceNames())
        {
            if (!resourceName.StartsWith("ArchLucid.ArtifactSynthesis.AzureIcons.", StringComparison.Ordinal)
                || !resourceName.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            using Stream stream = assembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException($"Missing embedded icon resource: {resourceName}");
            using SHA256 sha256 = SHA256.Create();
            byte[] hash = sha256.ComputeHash(stream);
            string hashText = Convert.ToHexString(hash);
            seenHashes.Add(hashText).Should().BeTrue($"duplicate icon bytes: {resourceName}");
        }

        seenHashes.Should().NotBeEmpty();
    }
}
