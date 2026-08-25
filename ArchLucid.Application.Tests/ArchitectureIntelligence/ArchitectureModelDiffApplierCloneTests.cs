using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureModelDiffApplierCloneTests
{
    [Fact]
    public void ApplyRecommendation_clones_provisional_flag_and_provenance()
    {
        ArchitectureModelDiffApplier sut = new();
        ClaimProvenance provenance = new()
        {
            Origin = ClaimOrigin.UserAsserted,
            SupportStatus = SupportStatus.DirectlyEstablished,
            Confidence = 0.9,
            Notes = "operator note",
        };

        ArchitectureKnowledgeModel before = new()
        {
            ModelId = "model-clone",
            TenantId = "tenant-clone",
            IsProvisionalSynthesis = true,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                    Provenance = provenance,
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-clone",
            Problem = "Missing auth",
            ProposedChange = "Add authentication at the edge.",
            Confidence = 0.8,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = 0.8,
            },
        };

        ArchitectureModelDiff diff = sut.ApplyRecommendation(before, recommendation);

        diff.AfterModel.IsProvisionalSynthesis.Should().BeTrue();
        diff.AfterModel.Elements
            .Single(element => element.ElementId == "svc-1")
            .Provenance.Notes.Should().Be("operator note");
        diff.AfterModel.Elements
            .Single(element => element.ElementId == "svc-1")
            .Provenance.Should().NotBeSameAs(provenance);
    }
}
