using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class TradeoffDetectionEngineTests
{
    [Fact]
    public async Task DetectAsync_single_region_with_rto_requirement_produces_conflicting_tradeoff()
    {
        TradeoffDetectionEngine engine = CreateEngine();
        ManifestDocument manifest = CreateSingleRegionManifest();
        IReadOnlyList<string> requirements = ["RTO must be 1 hour or less"];

        IReadOnlyList<ArchitectureTradeoff> tradeoffs = await engine.DetectAsync(
            manifest,
            new TransparencyTrail(),
            requirements,
            businessOutcome: null);

        ArchitectureTradeoff tradeoff = tradeoffs
            .Should()
            .ContainSingle(t => t.Mechanism == "cost-reliability/single-region")
            .Subject;

        tradeoff.Status.Should().Be(TradeoffStatus.Conflicting);
        tradeoff.Consequence.Should().Be(RiskConsequence.High);
        tradeoff.ConflictingRequirementId.Should().Be("req-0");
        tradeoff.CounterfactualRef.Should().Be("reliability-cost/multi-region");
    }

    [Fact]
    public async Task DetectAsync_single_region_without_rto_requirement_is_unacknowledged()
    {
        TradeoffDetectionEngine engine = CreateEngine();
        ManifestDocument manifest = CreateSingleRegionManifest();

        IReadOnlyList<ArchitectureTradeoff> tradeoffs = await engine.DetectAsync(
            manifest,
            new TransparencyTrail(),
            [],
            businessOutcome: null);

        ArchitectureTradeoff tradeoff = tradeoffs
            .Should()
            .ContainSingle(t => t.Mechanism == "cost-reliability/single-region")
            .Subject;

        tradeoff.Status.Should().Be(TradeoffStatus.Unacknowledged);
    }

    [Fact]
    public async Task DetectAsync_scale_to_zero_with_l0_acknowledgment_is_acknowledged()
    {
        TradeoffDetectionEngine engine = CreateEngine();
        ManifestDocument manifest = CreateScaleToZeroManifest();
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "answer.l0.pillar.cost",
                    Value = "scale-to-zero consumption plan is acceptable",
                },
            ],
        };

        IReadOnlyList<ArchitectureTradeoff> tradeoffs = await engine.DetectAsync(
            manifest,
            trail,
            [],
            businessOutcome: null);

        ArchitectureTradeoff tradeoff = tradeoffs
            .Should()
            .ContainSingle(t => t.Mechanism == "cost-performance/scale-to-zero")
            .Subject;

        tradeoff.Status.Should().Be(TradeoffStatus.Acknowledged);
        tradeoff.AcknowledgedByAnswerKey.Should().Be("answer.l0.pillar.cost");
    }

    [Fact]
    public void Order_sorts_conflicting_before_unacknowledged_before_acknowledged()
    {
        List<ArchitectureTradeoff> tradeoffs =
        [
            new()
            {
                Mechanism = "acknowledged",
                Status = TradeoffStatus.Acknowledged,
                Consequence = RiskConsequence.High,
                Reversibility = ReversibilityClass.OneWayDoor,
            },
            new()
            {
                Mechanism = "conflicting",
                Status = TradeoffStatus.Conflicting,
                Consequence = RiskConsequence.Low,
                Reversibility = ReversibilityClass.Reversible,
            },
            new()
            {
                Mechanism = "unacknowledged",
                Status = TradeoffStatus.Unacknowledged,
                Consequence = RiskConsequence.Medium,
                Reversibility = ReversibilityClass.Costly,
            },
        ];

        List<ArchitectureTradeoff> ordered = TradeoffOrdering.Sort(tradeoffs);

        ordered.Select(static tradeoff => tradeoff.Mechanism)
            .Should()
            .Equal("conflicting", "unacknowledged", "acknowledged");
    }

    [Fact]
    public async Task DetectAsync_optimization_mismatch_sets_related_outcome_ref()
    {
        TradeoffDetectionEngine engine = CreateEngine();
        ManifestDocument manifest = CreateSingleRegionManifest();

        IReadOnlyList<ArchitectureTradeoff> tradeoffs = await engine.DetectAsync(
            manifest,
            new TransparencyTrail(),
            [],
            businessOutcome: "improve reliability for customer-facing workloads");

        ArchitectureTradeoff tradeoff = tradeoffs
            .Should()
            .ContainSingle(t => t.Mechanism == "cost-reliability/single-region")
            .Subject;

        tradeoff.RelatedOutcomeRef.Should().Be("businessOutcome");
    }

    private static TradeoffDetectionEngine CreateEngine() =>
        new(new WafTradeoffCatalog(), new StubTradeoffConflictExplanationClient());

    private static ManifestDocument CreateSingleRegionManifest() =>
        new()
        {
            Topology = new TopologySection
            {
                Resources = ["single-region App Service deployment with no secondary region"],
            },
        };

    private static ManifestDocument CreateScaleToZeroManifest() =>
        new()
        {
            Topology = new TopologySection
            {
                Resources = ["Azure Functions on consumption plan with scale-to-zero enabled"],
            },
        };

    private sealed class StubTradeoffConflictExplanationClient : IFindingPayloadJsonCompletionClient
    {
        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken) =>
            Task.FromResult(
                """
                {
                  "explanationArchitect": "Single-region deployment conflicts with the stated recovery objective.",
                  "explanationExecutive": "Recovery commitments may slip and compliance exposure increases without a secondary region.",
                  "counterfactualStatement": "To satisfy the requirement, you would need multi-region deployment; approximate impact: higher baseline infrastructure spend."
                }
                """);
    }
}
