using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class IncrementalReReviewServiceTests
{
    private readonly IncrementalReReviewService _service = new();
    private readonly AsyncSpecialistReviewServiceAdapter _specialistReviewService =
        new(new SpecialistReviewService());

    [Fact]
    public async Task ReReviewAsync_always_runs_global_invariant_checks()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ReReviewScope scope = new()
        {
            AffectedElementIds = [],
            FullReReview = false,
        };

        IncrementalReReviewResult result = await _service.ReReviewAsync(model, scope, _specialistReviewService);

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
    public async Task ReReviewAsync_scoped_path_sets_partial_scope_disclaimer()
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
            ],
        };

        ReReviewScope scope = new()
        {
            AffectedElementIds = ["el-1"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        IncrementalReReviewResult result = await _service.ReReviewAsync(model, scope, _specialistReviewService);

        result.PartialScopeDisclaimer.Should().Be(
            "Only the affected subgraph was re-reviewed. Unreviewed remainder of the model is not guaranteed safe; "
            + "global invariant checks still apply.");
        result.FullReReviewTriggered.Should().BeFalse();
    }

    [Fact]
    public async Task ReReviewAsync_full_re_review_path_does_not_set_partial_scope_disclaimer()
    {
        ArchitectureKnowledgeModel model = new ArchitectureOntologyService().CreateEmptyModel("tenant-1");
        ReReviewScope scope = new()
        {
            AffectedElementIds = [],
            FullReReview = true,
            IncludeGlobalInvariantChecks = false,
        };

        IncrementalReReviewResult result = await _service.ReReviewAsync(model, scope, _specialistReviewService);

        result.PartialScopeDisclaimer.Should().BeNull();
        result.FullReReviewTriggered.Should().BeTrue();
    }

    [Fact]
    public async Task ReReviewAsync_scoped_model_preserves_IsProvisionalSynthesis()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-provisional",
            TenantId = "tenant-1",
            IsProvisionalSynthesis = true,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing",
                },
            ],
        };

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["el-1"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.IsProvisionalSynthesis.Should().BeTrue();
    }

    [Fact]
    public async Task ReReviewAsync_full_re_review_clones_model_before_specialist_review()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-full-clone",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing",
                },
            ],
        };

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = [],
            FullReReview = true,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeSameAs(model);
        model.Elements[0].Name = "mutated";
        capturingSpecialist.CapturedModel!.Elements[0].Name.Should().Be("Billing");
    }

    [Fact]
    public async Task ReReviewAsync_scoped_model_includes_reverse_related_chain_regardless_of_element_order()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-reverse-chain",
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

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["affected-target"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.Elements.Select(element => element.ElementId)
            .Should()
            .BeEquivalentTo(["affected-target", "middle-link", "upstream-consumer"]);
    }

    [Fact]
    public async Task ReReviewAsync_scoped_model_includes_forward_related_chain_regardless_of_element_order()
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

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["affected-target"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.Elements.Select(element => element.ElementId)
            .Should()
            .BeEquivalentTo(["affected-target", "middle-link", "downstream-consumer"]);
    }

    [Fact]
    public async Task ReReviewAsync_scoped_model_includes_forward_related_elements_discovered_via_reverse_related_hubs()
    {
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-mixed-chain",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "checkout-cache",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout cache",
                },
                new ArchitectureModelElement
                {
                    ElementId = "worker",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout worker",
                    RelatedElementIds = ["affected-target", "checkout-cache"],
                },
                new ArchitectureModelElement
                {
                    ElementId = "affected-target",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Checkout API",
                },
            ],
        };

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["affected-target"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        capturingSpecialist.CapturedModel.Should().NotBeNull();
        capturingSpecialist.CapturedModel!.Elements.Select(element => element.ElementId)
            .Should()
            .BeEquivalentTo(["affected-target", "worker", "checkout-cache"]);
    }

    [Fact]
    public async Task ReReviewAsync_scoped_model_clones_elements_and_provenance()
    {
        ClaimProvenance provenance = new()
        {
            Origin = ClaimOrigin.UserAsserted,
            SupportStatus = SupportStatus.DirectlyEstablished,
            Notes = "scoped clone",
        };

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-clone",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Billing",
                    Provenance = provenance,
                },
            ],
        };

        CapturingAsyncSpecialistReviewService capturingSpecialist = new();
        ReReviewScope scope = new()
        {
            AffectedElementIds = ["el-1"],
            FullReReview = false,
            IncludeGlobalInvariantChecks = false,
        };

        await _service.ReReviewAsync(model, scope, capturingSpecialist);

        ArchitectureModelElement scopedElement = capturingSpecialist.CapturedModel!
            .Elements.Single(element => element.ElementId == "el-1");
        scopedElement.Provenance.Notes.Should().Be("scoped clone");
        scopedElement.Provenance.Should().NotBeSameAs(provenance);
    }

    private sealed class AsyncSpecialistReviewServiceAdapter(SpecialistReviewService inner) : IAsyncSpecialistReviewService
    {
        public Task<SpecialistReviewResult> ReviewAsync(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<QualityDimension>? dimensions = null,
            CancellationToken cancellationToken = default)
            => Task.FromResult(inner.Review(model, dimensions));
    }

    private sealed class CapturingAsyncSpecialistReviewService : IAsyncSpecialistReviewService
    {
        public ArchitectureKnowledgeModel? CapturedModel { get; private set; }

        public Task<SpecialistReviewResult> ReviewAsync(
            ArchitectureKnowledgeModel model,
            IReadOnlyList<QualityDimension>? dimensions = null,
            CancellationToken cancellationToken = default)
        {
            CapturedModel = model;
            return Task.FromResult(new SpecialistReviewResult());
        }
    }
}
