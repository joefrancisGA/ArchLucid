using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ChangeImpactAnalyzerTests
{
    private readonly ChangeImpactAnalyzer _analyzer = new();
    private readonly ArchitectureModelDiffApplier _applier = new();

    [Fact]
    public void Analyze_diff_includes_graph_completeness_caveat_and_diff_entries()
    {
        ArchitectureKnowledgeModel before = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "comp-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing worker",
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-1",
            Problem = "Missing trust boundary",
            Evidence = "Public API.",
            AffectedRequirementOrQualityAttribute = "Security",
            ConsequenceOfInaction = "Exposure remains.",
            ProposedChange = "Add a trust boundary around the public API.",
            ValidationMethod = "Review.",
        };

        ArchitectureModelDiff diff = _applier.ApplyRecommendation(before, recommendation);
        ChangeImpactResult impact = _analyzer.Analyze(diff, recommendation);

        impact.GraphCompletenessCaveat.Should().Contain("not treat this list as exhaustive");
        impact.ImpactedItems.Should().NotBeEmpty();
        impact.RequiresFullReReview.Should().BeTrue();
        diff.Entries.Should().Contain(entry => entry.ElementKind == ArchitectureElementKind.TrustBoundary);
    }
}
