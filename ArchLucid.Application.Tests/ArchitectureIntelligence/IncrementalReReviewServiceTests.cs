using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class IncrementalReReviewServiceTests
{
    private readonly IncrementalReReviewService _service = new();
    private readonly SpecialistReviewService _specialistReviewService = new();

    [Fact]
    public void ReReview_always_runs_global_invariant_checks()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ReReviewScope scope = new()
        {
            AffectedElementIds = [],
            FullReReview = false,
        };

        IncrementalReReviewResult result = _service.ReReview(model, scope, _specialistReviewService);

        result.GlobalInvariantResults.Should().HaveCount(3);
        result.GlobalInvariantResults.Select(check => check.InvariantId).Should().BeEquivalentTo(
        [
            "INV-TENANT-ISOLATION",
            "INV-DATA-RESIDENCY",
            "INV-AUTHENTICATION",
        ]);
    }
}
