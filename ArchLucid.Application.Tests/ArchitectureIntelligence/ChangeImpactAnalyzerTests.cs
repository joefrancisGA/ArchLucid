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

    [Fact]
    public void Analyze_does_not_include_related_elements_from_unimpacted_sources()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-related",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "comp-unrelated",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Legacy batch job",
                    RelatedElementIds = ["storage-orphan"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "storage-orphan",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Cold archive bucket",
                },
                new ArchitectureModelElement
                {
                    ElementId = "comp-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout API",
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-related",
            Problem = "Checkout latency",
            Evidence = "Trace data.",
            AffectedRequirementOrQualityAttribute = "Performance",
            ConsequenceOfInaction = "Latency remains.",
            ProposedChange = "Optimize Checkout API caching.",
            ValidationMethod = "Load test.",
        };

        ChangeImpactResult impact = _analyzer.Analyze(model, recommendation);

        impact.ImpactedItems.Should().Contain(item => item.ElementId == "comp-target");
        impact.ImpactedItems.Should().NotContain(item => item.ElementId == "storage-orphan");
        impact.ImpactedItems.Should().NotContain(item => item.ElementId == "comp-unrelated");
    }

    [Fact]
    public void Analyze_includes_related_elements_from_directly_impacted_sources()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-related-direct",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "comp-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout API",
                    RelatedElementIds = ["storage-linked"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "storage-linked",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout cache",
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-related-direct",
            Problem = "Checkout latency",
            Evidence = "Trace data.",
            AffectedRequirementOrQualityAttribute = "Performance",
            ConsequenceOfInaction = "Latency remains.",
            ProposedChange = "Optimize Checkout API caching.",
            ValidationMethod = "Load test.",
        };

        ChangeImpactResult impact = _analyzer.Analyze(model, recommendation);

        impact.ImpactedItems.Should().Contain(item => item.ElementId == "comp-target");
        impact.ImpactedItems.Should().Contain(item =>
            item.ElementId == "storage-linked"
            && item.Description.Contains("indirectly impacted", StringComparison.Ordinal));
    }

    [Fact]
    public void Analyze_includes_multi_hop_related_elements_from_directly_impacted_sources()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-related-chain",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "downstream-consumer",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Downstream consumer",
                },
                new ArchitectureModelElement
                {
                    ElementId = "middle-link",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Middle link",
                    RelatedElementIds = ["downstream-consumer"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "comp-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout API",
                    RelatedElementIds = ["middle-link"],
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-related-chain",
            Problem = "Checkout latency",
            Evidence = "Trace data.",
            AffectedRequirementOrQualityAttribute = "Performance",
            ConsequenceOfInaction = "Latency remains.",
            ProposedChange = "Optimize Checkout API caching.",
            ValidationMethod = "Load test.",
        };

        ChangeImpactResult impact = _analyzer.Analyze(model, recommendation);

        impact.ImpactedItems.Should().Contain(item => item.ElementId == "comp-target");
        impact.ImpactedItems.Should().Contain(item => item.ElementId == "middle-link");
        impact.ImpactedItems.Should().Contain(item =>
            item.ElementId == "downstream-consumer"
            && item.Description.Contains("indirectly impacted", StringComparison.Ordinal));
    }

    [Fact]
    public void Analyze_includes_reverse_related_elements_pointing_at_directly_impacted_targets()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-related-reverse",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "upstream-gateway",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Edge gateway",
                    RelatedElementIds = ["comp-target"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "comp-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout API",
                },
            ],
        };

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-related-reverse",
            Problem = "Checkout latency",
            Evidence = "Trace data.",
            AffectedRequirementOrQualityAttribute = "Performance",
            ConsequenceOfInaction = "Latency remains.",
            ProposedChange = "Optimize Checkout API caching.",
            ValidationMethod = "Load test.",
        };

        ChangeImpactResult impact = _analyzer.Analyze(model, recommendation);

        impact.ImpactedItems.Should().Contain(item => item.ElementId == "comp-target");
        impact.ImpactedItems.Should().Contain(item =>
            item.ElementId == "upstream-gateway"
            && item.Description.Contains("indirectly impacted", StringComparison.Ordinal));
    }
}
