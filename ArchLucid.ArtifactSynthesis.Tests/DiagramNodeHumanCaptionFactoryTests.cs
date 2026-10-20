using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
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

        DiagramNodeHumanCaptionFactory.Create(node).CombinedPlainText.Should().Be(
            "orphan · Resource type was not stored");
    }

    [Fact]
    public void Create_appends_resource_group_not_stored_when_caption_requires_group()
    {
        DiagramNode node = new()
        {
            NodeId = "vm-1",
            Label = "vm-app",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
            IncludeResourceGroupInCaption = true,
            ArmResourceGroup = "   ",
        };

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);

        caption.CombinedPlainText.Should().Contain("Resource group was not stored.");
        caption.CombinedPlainText.Should().Contain("vm-app (Virtual machine)");
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
        caption.AccessibilityTitle.Should().Be("vm-app · Resource type was not stored");
    }

    [Fact]
    public void Create_appends_not_classified_for_unknown_connection_state()
    {
        DiagramNode node = new()
        {
            NodeId = "n1",
            Label = "resource-a",
            ConnectionState = InventoryDiagramConnectionState.Unknown,
        };

        DiagramNodeHumanCaptionFactory.Create(node).CombinedPlainText.Should()
            .Be("resource-a · Resource type was not stored · Connection state was not classified.");
    }
}
