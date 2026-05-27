using ArchLucid.Core.Manifest;

using FluentAssertions;

using System.Text.Json;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class ResolvedArchitectureDecisionBuyerConfidenceSourceTests
{
    [Fact]
    public void BuyerConfidenceSource_serializes_for_manifest_read()
    {
        ResolvedArchitectureDecision decision = new()
        {
            Category = "Security",
            Title = "MFA",
            SelectedOption = "Required",
            Rationale = "Control gap",
            Confidence = 88,
            ConfidenceSource = DecisionConfidenceSource.FindingEvaluation,
        };

        string json = JsonSerializer.Serialize(decision);

        json.Should().Contain("\"buyerConfidenceSource\":\"Evidence-backed\"");
        json.Should().Contain("\"Confidence\":88");
    }

    [Fact]
    public void Unknown_confidence_source_maps_to_unknown_buyer_label()
    {
        ResolvedArchitectureDecision decision = new()
        {
            Category = "Security",
            Title = "Gap",
            SelectedOption = "Review",
            Rationale = "No score",
            Confidence = null,
            ConfidenceSource = DecisionConfidenceSource.Unknown,
        };

        decision.BuyerConfidenceSource.Should().Be(BuyerDecisionConfidenceSource.Unknown);
    }
}
