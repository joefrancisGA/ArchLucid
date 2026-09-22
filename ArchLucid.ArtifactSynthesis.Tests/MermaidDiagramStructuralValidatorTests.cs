using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramStructuralValidatorTests
{
    private readonly MermaidDiagramStructuralValidator validator = new();

    [Fact]
    public void TryValidate_accepts_invisible_layout_links()
    {
        const string mermaid = """
            flowchart TD
                n_a["vnet-eastus"]
                n_b["vnet-westus"]
                n_a ~~~ n_b
            """;

        bool valid = validator.TryValidate(mermaid, out IReadOnlyList<string> errors);

        valid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public void TryValidate_accepts_compiled_executive_owner_shape()
    {
        DiagramAstFromGraphCompiler compiler = new();
        MermaidDiagramRenderer renderer = new();
        string mermaid = renderer.Render(compiler.Compile(
            DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph(),
            DiagramMode.Executive));

        mermaid.Should().Contain("~~~");

        bool valid = validator.TryValidate(mermaid, out IReadOnlyList<string> errors);

        valid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
