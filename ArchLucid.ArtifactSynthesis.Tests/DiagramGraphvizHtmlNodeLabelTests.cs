using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramGraphvizHtmlNodeLabelTests
{
    [Fact]
    public void Format_uses_html_table_with_compute_accent_for_virtual_machine()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<TABLE BORDER=\"0\" CELLBORDER=\"0\" CELLSPACING=\"0\" CELLPADDING=\"2\"><TR><TD WIDTH=\"8\" BGCOLOR=\"#2563eb\"></TD><TD ALIGN=\"LEFT\" BALIGN=\"LEFT\"><B>vm-app</B><BR/>(Virtual machine)</TD></TR></TABLE>>");
    }

    [Fact]
    public void Format_uses_html_table_with_network_accent_for_vnet()
    {
        DiagramNode node = new()
        {
            NodeId = "vnet-1",
            Label = "vnet-eastus",
            ArmResourceType = "Microsoft.Network/virtualNetworks",
        };

        DiagramGraphvizHtmlNodeLabel.Format(node)
            .Should()
            .Be("<<TABLE BORDER=\"0\" CELLBORDER=\"0\" CELLSPACING=\"0\" CELLPADDING=\"2\"><TR><TD WIDTH=\"8\" BGCOLOR=\"#0f766e\"></TD><TD ALIGN=\"LEFT\" BALIGN=\"LEFT\"><B>vnet-eastus</B><BR/>(Virtual network)</TD></TR></TABLE>>");
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
            .Contain("rg-app-prod")
            .And.Contain("BGCOLOR=\"#2563eb\"");
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
            .Contain("<B>stlogs</B><BR/>rg-data-prod")
            .And.Contain("BGCOLOR=\"#475569\"");
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
            .Be("<<TABLE BORDER=\"0\" CELLBORDER=\"0\" CELLSPACING=\"0\" CELLPADDING=\"2\"><TR><TD WIDTH=\"8\" BGCOLOR=\"#2563eb\"></TD><TD ALIGN=\"LEFT\" BALIGN=\"LEFT\"><B>vm-app</B><BR/>(Virtual machine)</TD></TR></TABLE>>");
    }
}
