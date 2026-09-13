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
}
