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

    [Fact]
    public void Format_appends_resource_group_line_when_arm_resource_group_is_set()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
            ArmResourceGroup = "rg-app-prod",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<B>vm-app</B><BR/>(Virtual machine)<BR/>rg-app-prod>");
    }

    [Fact]
    public void Format_appends_resource_group_without_type_line_when_type_is_missing()
    {
        DiagramNode node = new()
        {
            NodeId = "st-1",
            Label = "stlogs",
            ArmResourceGroup = "rg-data-prod",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<B>stlogs</B><BR/>rg-data-prod>");
    }

    [Fact]
    public void Format_omits_resource_group_line_when_arm_resource_group_is_blank()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
            ArmResourceGroup = "  ",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<B>vm-app</B><BR/>(Virtual machine)>");
    }
}
