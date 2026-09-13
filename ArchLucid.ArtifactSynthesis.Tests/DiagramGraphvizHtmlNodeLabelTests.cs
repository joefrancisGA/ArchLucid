using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramGraphvizHtmlNodeLabelTests
{
    [Fact]
    public void Format_uses_html_bold_name_and_type_line()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<B>vm-app</B><BR/>(Virtual machine)>");
    }
}
