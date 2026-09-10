using ArchLucid.Contracts.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.WafTradeoff;

[Trait("Category", "Unit")]
public sealed class WafTradeoffCatalogTests
{
    private static readonly string[] SeedMechanismKeys =
    [
        "cost-reliability/single-region",
        "cost-performance/scale-to-zero",
        "security-performance/private-endpoints",
        "security-operations/controls-friction",
        "performance-reliability/caching",
        "reliability-cost/multi-region",
    ];

    [Fact]
    public void Default_catalog_has_at_least_six_seed_entries()
    {
        WafTradeoffCatalog catalog = new();

        catalog.All.Count.Should().BeGreaterThanOrEqualTo(6);
    }

    [Theory]
    [MemberData(nameof(SeedMechanismKeysMemberData))]
    public void FindByKey_returns_seed_entry(string mechanismKey)
    {
        WafTradeoffCatalog catalog = new();

        WafTradeoffCatalogEntry? entry = catalog.FindByKey(mechanismKey);

        entry.Should().NotBeNull();
        entry!.MechanismKey.Should().Be(mechanismKey);
        entry.MechanismLabel.Should().NotBeNullOrWhiteSpace();
        entry.DetectionSignatures.Should().NotBeEmpty();
    }

    [Fact]
    public void FindCounterfactual_single_region_returns_multi_region_entry()
    {
        WafTradeoffCatalog catalog = new();

        WafTradeoffCatalogEntry? counterfactual =
            catalog.FindCounterfactual("cost-reliability/single-region");

        counterfactual.Should().NotBeNull();
        counterfactual!.MechanismKey.Should().Be("reliability-cost/multi-region");
        counterfactual.GainedPillar.Should().Be(WafPillar.Reliability);
        counterfactual.SacrificedPillar.Should().Be(WafPillar.Cost);
    }

    [Fact]
    public void Detection_signatures_are_lowercase()
    {
        WafTradeoffCatalog catalog = new();

        foreach (WafTradeoffCatalogEntry entry in catalog.All)
        {
            entry.DetectionSignatures.Should().OnlyContain(static signature => signature == signature.ToLowerInvariant());
        }
    }

    [Fact]
    public void Validate_throws_when_counterfactual_key_is_missing()
    {
        List<WafTradeoffCatalogEntry> entries =
        [
            new()
            {
                MechanismKey = "cost-reliability/single-region",
                MechanismLabel = "Single region",
                GainedPillar = WafPillar.Cost,
                SacrificedPillar = WafPillar.Reliability,
                DetectionSignatures = ["single-region"],
                CounterfactualKey = "missing-key",
                DefaultConsequence = RiskConsequence.High,
                DefaultReversibility = ReversibilityClass.Costly,
            },
        ];

        Action act = () => WafTradeoffCatalogValidator.Validate(entries);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*missing counterfactualKey 'missing-key'*");
    }

    [Fact]
    public void Validate_throws_when_mechanism_key_is_duplicated()
    {
        List<WafTradeoffCatalogEntry> entries =
        [
            new()
            {
                MechanismKey = "cost-reliability/single-region",
                MechanismLabel = "Single region",
                GainedPillar = WafPillar.Cost,
                SacrificedPillar = WafPillar.Reliability,
                DetectionSignatures = ["single-region"],
                CounterfactualKey = null,
                DefaultConsequence = RiskConsequence.High,
                DefaultReversibility = ReversibilityClass.Costly,
            },
            new()
            {
                MechanismKey = "cost-reliability/single-region",
                MechanismLabel = "Duplicate",
                GainedPillar = WafPillar.Cost,
                SacrificedPillar = WafPillar.Reliability,
                DetectionSignatures = ["duplicate"],
                CounterfactualKey = null,
                DefaultConsequence = RiskConsequence.Low,
                DefaultReversibility = ReversibilityClass.Reversible,
            },
        ];

        Action act = () => WafTradeoffCatalogValidator.Validate(entries);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*duplicate mechanismKey*");
    }

    public static IEnumerable<object[]> SeedMechanismKeysMemberData()
    {
        foreach (string mechanismKey in SeedMechanismKeys)
            yield return [mechanismKey];
    }
}
