using ArchLucid.Application.Graphviz;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Graphviz;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class GraphvizFdpLayoutRendererTests
{
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Fact]
    public void ResolveBinaryPath_returns_null_when_fdp_missing()
    {
        GraphvizFdpLayoutRenderer.ResolveBinaryPath("definitely-missing-fdp-binary-717e")
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task RenderSvgAsync_fails_soft_when_binary_missing()
    {
        GraphvizFdpLayoutRenderer renderer = CreateRenderer(enabled: true, fdpPath: "definitely-missing-fdp-binary-717e");
        string dot = dotEmitter.Emit(BuildSingleNodeAst());

        GraphvizLayoutRenderResult result = await renderer.RenderSvgAsync(dot, CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.Svg.Should().BeNull();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task RenderSvgAsync_fails_soft_when_disabled()
    {
        GraphvizFdpLayoutRenderer renderer = CreateRenderer(enabled: false);
        GraphvizLayoutRenderResult result = await renderer.RenderSvgAsync("digraph G { a; }", CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("disabled");
    }

    [Fact]
    public async Task RenderSvgAsync_rejects_unsafe_script_markup_when_fdp_available()
    {
        string? fdpPath = GraphvizFdpLayoutRenderer.ResolveBinaryPath("fdp");

        if (fdpPath is null)
        {
            return;
        }

        GraphvizFdpLayoutRenderer renderer = CreateRenderer(enabled: true, fdpPath: "fdp");
        string dot = dotEmitter.Emit(BuildSingleNodeAst());
        GraphvizLayoutRenderResult result = await renderer.RenderSvgAsync(dot, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotBeNullOrWhiteSpace();
        result.Svg!.Should().NotContain("<script", because: "sanitizer strips script tags");
        result.Svg.Should().NotContain("onclick", because: "sanitizer strips event handlers");
    }

    [Fact]
    public async Task RenderSvgAsync_owner_shape_dot_produces_compact_svg_when_fdp_available()
    {
        string? fdpPath = GraphvizFdpLayoutRenderer.ResolveBinaryPath("fdp");

        if (fdpPath is null)
        {
            return;
        }

        DiagramAst ast = BuildPeeringPairAst();
        string dot = dotEmitter.Emit(ast);
        GraphvizFdpLayoutRenderer renderer = CreateRenderer(enabled: true, fdpPath: "fdp");

        GraphvizLayoutRenderResult result = await renderer.RenderSvgAsync(dot, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"node\"");
        result.Svg.Should().NotContain("4000");
    }

    private static GraphvizFdpLayoutRenderer CreateRenderer(bool enabled, string fdpPath = "fdp")
    {
        return new GraphvizFdpLayoutRenderer(
            new TestGraphvizOptionsMonitor(new GraphvizOptions
            {
                Enabled = enabled,
                FdpPath = fdpPath,
            }),
            NullLogger<GraphvizFdpLayoutRenderer>.Instance);
    }

    private static DiagramAst BuildSingleNodeAst()
    {
        return new DiagramAst
        {
            Title = "single",
            Nodes = [new DiagramNode { NodeId = "only", Label = "only", NodeType = "vnet" }],
        };
    }

    private static DiagramAst BuildPeeringPairAst()
    {
        return new DiagramAst
        {
            Title = "pair",
            Nodes =
            [
                new DiagramNode { NodeId = "left", Label = "vnet-left", NodeType = "vnet" },
                new DiagramNode { NodeId = "right", Label = "vnet-right", NodeType = "vnet" },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "left", ToNodeId = "right", Label = "peered" },
            ],
        };
    }

    private sealed class TestGraphvizOptionsMonitor(GraphvizOptions value) : IOptionsMonitor<GraphvizOptions>
    {
        public GraphvizOptions CurrentValue { get; } = value;

        public GraphvizOptions Get(string? name) => CurrentValue;

        public IDisposable? OnChange(Action<GraphvizOptions, string?> listener) => null;
    }
}
