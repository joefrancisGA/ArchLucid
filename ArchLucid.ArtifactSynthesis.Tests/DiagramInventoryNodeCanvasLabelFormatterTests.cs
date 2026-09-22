using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramInventoryNodeCanvasLabelFormatterTests
{
    private static readonly DiagramForestLayoutOptions DefaultOptions = new();

    [Fact]
    public void FormatLines_keeps_short_names_on_one_line()
    {
        IReadOnlyList<string> lines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            "vnet-eastus",
            ["vnet-eastus", "vnet-westus"],
            DefaultOptions);

        lines.Should().Equal("vnet-eastus");
    }

    [Fact]
    public void FormatLines_truncates_auto_generated_names_with_unique_prefix()
    {
        string longName = $"vm-production-eastus-{new string('a', 30)}-001";
        string peerName = $"vm-production-eastus-{new string('a', 30)}-002";
        IReadOnlyList<string> peerNames = [longName, peerName];

        IReadOnlyList<string> lines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            longName,
            peerNames,
            new DiagramForestLayoutOptions { UniformNodeWidth = 400 });

        lines.Should().HaveCount(1);
        lines[0].Should().EndWith("...");
        lines[0].Should().Contain("vm-production-eastus");
    }

    [Fact]
    public void FormatLines_wraps_non_auto_generated_names_when_needed()
    {
        IReadOnlyList<string> lines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            "Azure Kubernetes Service (AKS) Cluster",
            ["Azure Kubernetes Service (AKS) Cluster"],
            new DiagramForestLayoutOptions { UniformNodeWidth = 160, NodePaddingX = 8 });

        lines.Count.Should().BeGreaterThan(1);
        string.Join(' ', lines).Should().Be("Azure Kubernetes Service (AKS) Cluster");
    }
}
