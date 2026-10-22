using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArtifactRoundTripServiceTests
{
    private readonly ArtifactRoundTripService _service = new();

    [Fact]
    public void CanRegenerate_returns_false_for_imported_artifacts()
    {
        _service.CanRegenerate(ArtifactOwnershipClass.Imported).Should().BeFalse();
        _service.CanRegenerate(ArtifactOwnershipClass.Managed).Should().BeTrue();
    }

    [Fact]
    public void ProposeModelDiffFromEdit_requires_user_approval()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        int elementCountBefore = model.Elements.Count;

        bool appliedWithoutApproval = _service.ProposeModelDiffFromEdit(
            model,
            "src-edit",
            "edited content",
            userApprovalGranted: false);

        bool appliedWithApproval = _service.ProposeModelDiffFromEdit(
            model,
            "src-edit",
            "edited content",
            userApprovalGranted: true);

        appliedWithoutApproval.Should().BeFalse();
        appliedWithApproval.Should().BeTrue();
        model.Elements.Count.Should().Be(elementCountBefore + 1);
    }
}
