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

        result.GlobalInvariantResults.Should().HaveCount(5);
        result.GlobalInvariantResults.Select(check => check.InvariantId).Should().BeEquivalentTo(
        [
            "INV-TENANT-ISOLATION",
            "INV-DATA-RESIDENCY",
            "INV-AUTHENTICATION",
            "INV-LATENCY-CEILING",
            "INV-OPERATIONAL-OWNERSHIP",
        ]);
    }

    [Fact]
    public void ReReview_scoped_path_sets_partial_scope_disclaimer()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing",
                },
                new ArchitectureModelElement
                {
                    ElementId = "el-2",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Unrelated",
                },
            ],
        };

        ReReviewScope scope = new()
        {
            AffectedElementIds = ["el-1"],
            FullReReview = false,
        };

        IncrementalReReviewResult result = _service.ReReview(model, scope, _specialistReviewService);

        result.FullReReviewTriggered.Should().BeFalse();
        result.PartialScopeDisclaimer.Should().Contain("Unreviewed remainder");
        result.SpecialistResults.Should().NotBeEmpty();
        result.GlobalInvariantResults.Should().HaveCount(5);
    }

    [Fact]
    public void ReReview_skips_global_invariant_checks_when_flag_disabled()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ReReviewScope scope = new()
        {
            AffectedElementIds = [],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        IncrementalReReviewResult result = _service.ReReview(model, scope, _specialistReviewService);

        result.GlobalInvariantResults.Should().BeEmpty();
    }

    [Fact]
    public void ReReview_scoped_model_includes_reverse_related_chain_regardless_of_element_order()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-chain",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "upstream-consumer",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Upstream consumer",
                    RelatedElementIds = ["middle-link"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "middle-link",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Middle link",
                    RelatedElementIds = ["affected-target"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "affected-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Affected target",
                },
            ],
        };

        CapturingSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["affected-target"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        _service.ReReview(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.Elements.Select(element => element.ElementId)
            .Should()
            .BeEquivalentTo(["affected-target", "middle-link", "upstream-consumer"]);
    }

    [Fact]
    public void ReReview_scoped_model_includes_forward_related_chain_regardless_of_element_order()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-forward-chain",
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
                    ElementId = "affected-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Affected target",
                    RelatedElementIds = ["middle-link"],
                },
            ],
        };

        CapturingSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["affected-target"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        _service.ReReview(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.Elements.Select(element => element.ElementId)
            .Should()
            .BeEquivalentTo(["affected-target", "middle-link", "downstream-consumer"]);
    }

    private sealed class CapturingSpecialistReviewService : ISpecialistReviewService
    {
        public ArchitectureKnowledgeModel? CapturedModel { get; private set; }

        public SpecialistReviewResult Review(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<QualityDimension>? dimensions = null)
        {
            CapturedModel = model;
            return new SpecialistReviewResult();
        }
    }
}
