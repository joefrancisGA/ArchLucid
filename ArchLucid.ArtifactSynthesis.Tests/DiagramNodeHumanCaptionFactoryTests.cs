using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramNodeHumanCaptionFactoryTests
{
    [Fact]
    public void Create_appends_friendly_type_in_parentheses()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
        };

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);

        caption.ResourceName.Should().Be("vm-app");
        caption.TypeCaption.Should().Be("Virtual machine");
        caption.ResourceGroupCaption.Should().BeNull();
        caption.CombinedPlainText.Should().Be("vm-app (Virtual machine)");
        caption.AccessibilityTitle.Should().Be("vm-app (Virtual machine)");
    }

    [Fact]
    public void Create_omits_parentheses_when_type_is_missing()
    {
        DiagramNode node = new()
        {
            NodeId = "n1",
            Label = "orphan",
        };

        DiagramNodeHumanCaptionFactory.Create(node).CombinedPlainText.Should().Be("orphan");
    }

    [Fact]
    public void Create_includes_resource_group_in_accessibility_title_without_changing_combined_plain_text()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
            ArmResourceGroup = "rg-app-prod",
        };

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);

        caption.ResourceGroupCaption.Should().Be("rg-app-prod");
        caption.CombinedPlainText.Should().Be("vm-app (Virtual machine)");
        caption.AccessibilityTitle.Should().Be("vm-app (Virtual machine) · rg-app-prod");
    }

    [Fact]
    public void Create_omits_resource_group_when_arm_resource_group_is_blank()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceGroup = "   ",
        };

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);

        caption.ResourceGroupCaption.Should().BeNull();
        caption.AccessibilityTitle.Should().Be("vm-app");
        caption.AccessibilityTitle.Should().NotContain(" · ");
    }
}
