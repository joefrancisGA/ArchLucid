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

        caption.CombinedPlainText.Should().Contain("Resource group was stored empty.");
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
    public void TryFormatDataFlowTypeCaption_labels_unknown_site_kind_without_claiming_it_was_not_stored()
    {
        DiagramNode node = new()
        {
            NodeId = "site-1",
            ArmResourceType = "Microsoft.Web/sites",
            ArmResourceKind = "workflowapp",
        };

        DiagramNodeHumanCaptionFactory.TryFormatDataFlowTypeCaption(node).Should()
            .Be("Site kind workflowapp has no reviewer label.");
    }

    [Fact]
    public void TryFormatDataFlowTypeCaption_keeps_blank_site_kind_as_not_stored()
    {
        DiagramNode node = new()
        {
            NodeId = "site-1",
            ArmResourceType = "Microsoft.Web/sites",
            ArmResourceKind = "   ",
        };

        DiagramNodeHumanCaptionFactory.TryFormatDataFlowTypeCaption(node).Should()
            .Be("Site kind was not stored.");
    }

    [Fact]
    public void Create_labels_whitespace_only_resource_name_as_stored_empty()
    {
        DiagramNode node = new()
        {
            NodeId = "n1",
            Label = "   ",
        };

        DiagramNodeHumanCaptionFactory.Create(node).CombinedPlainText.Should()
            .Be("Resource name was stored empty. · Resource type was not stored");
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
            .Be("resource-a · Resource type was not stored · Connection state was not stored.");
    }

    [Fact]
    public void Create_labels_used_and_orphaned_connection_states_without_legacy_posture_copy()
    {
        DiagramNode usedWithMessage = new()
        {
            NodeId = "used-1",
            Label = "pe-1",
            ConnectionState = InventoryDiagramConnectionState.Used,
            ConnectionStateMessage = "attached to subnet-a",
        };

        DiagramNodeHumanCaptionFactory.Create(usedWithMessage).CombinedPlainText.Should()
            .Contain("In use off the diagram: attached to subnet-a");

        DiagramNode usedWithoutMessage = new()
        {
            NodeId = "used-2",
            Label = "pe-2",
            ConnectionState = InventoryDiagramConnectionState.Used,
        };

        DiagramNodeHumanCaptionFactory.Create(usedWithoutMessage).CombinedPlainText.Should()
            .Contain("Off-diagram use was not stored.");

        DiagramNode orphaned = new()
        {
            NodeId = "orphan-1",
            Label = "nic-1",
            ConnectionState = InventoryDiagramConnectionState.Orphaned,
            ConnectionStateMessage = "no subnet association",
        };

        DiagramNodeHumanCaptionFactory.Create(orphaned).CombinedPlainText.Should()
            .Contain("No stored association: no subnet association.");
    }

    [Fact]
    public void Create_omits_connection_state_copy_when_state_was_not_stored_on_the_wire()
    {
        DiagramNode node = new()
        {
            NodeId = "n-null-state",
            Label = "resource-b",
            ConnectionState = null,
        };

        DiagramNodeHumanCaptionFactory.Create(node).CombinedPlainText.Should()
            .Be("resource-b · Resource type was not stored");
    }
}
