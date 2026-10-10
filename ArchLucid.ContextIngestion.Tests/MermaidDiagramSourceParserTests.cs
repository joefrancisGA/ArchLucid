using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class MermaidDiagramSourceParserTests
{
    [Fact]
    public void Parse_C4DeclarationAfterRelationship_UpgradesPlaceholderNode()
    {
        MermaidDiagramSourceParser parser = new();

        DiagramParseResult result = parser.Parse(new DiagramSourceReference
        {
            Name = "architecture.mmd",
            Format = DiagramSourceFormats.Mermaid,
            Content = """
                      C4Context
                      Rel(user, app, "uses")
                      Person(user, "User")
                      System(app, "Application")
                      """,
        });

        result.Model.Nodes.Should().ContainSingle(node =>
            node.Id == "user"
            && node.Label == "User"
            && node.Kind == ArchitectureDiagramNodeKinds.User);
        result.Model.Nodes.Should().ContainSingle(node =>
            node.Id == "app"
            && node.Label == "Application"
            && node.Kind == ArchitectureDiagramNodeKinds.System);
    }
}
