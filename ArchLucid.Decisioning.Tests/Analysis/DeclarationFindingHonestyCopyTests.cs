using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DeclarationFindingHonestyCopyTests
{
    [Fact]
    public void FormatResourceLabel_uses_honesty_copy_instead_of_node_id()
    {
        DeclarationFindingHonestyCopy.FormatResourceLabel(null)
            .Should()
            .Be(DeclarationFindingHonestyCopy.ResourceNameNotStored);
        DeclarationFindingHonestyCopy.FormatResourceLabel("   ")
            .Should()
            .Be(DeclarationFindingHonestyCopy.ResourceNameNotStored);
        DeclarationFindingHonestyCopy.FormatResourceLabel(" checkout ")
            .Should()
            .Be("checkout");
    }

    [Fact]
    public void FormatPropertyName_and_requirement_label_use_honesty_copy()
    {
        DeclarationFindingHonestyCopy.FormatPropertyName(" ")
            .Should()
            .Be(DeclarationFindingHonestyCopy.PropertyNameNotStored);
        DeclarationFindingHonestyCopy.FormatRequirementLabel(null)
            .Should()
            .Be(DeclarationFindingHonestyCopy.RequirementNameNotStored);
    }
}
