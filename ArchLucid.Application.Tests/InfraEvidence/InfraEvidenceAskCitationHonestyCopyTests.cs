using ArchLucid.Application.InfraEvidence.Ask;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceAskCitationHonestyCopyTests
{
    [Fact]
    public void CorrespondenceIdNotStored_is_stable_copy()
    {
        InfraEvidenceAskCitationHonestyCopy.CorrespondenceIdNotStored
            .Should()
            .Be("Correspondence id was not stored.");
    }

    [Fact]
    public void DiagramNodeLabelNotStored_is_stable_copy()
    {
        InfraEvidenceAskCitationHonestyCopy.DiagramNodeLabelNotStored
            .Should()
            .Be("Diagram node label was not stored.");
    }
}
