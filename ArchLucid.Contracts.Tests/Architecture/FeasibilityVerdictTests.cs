using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

/// <summary>Contract tests for feasibility verdict types (ADR 0050).</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FeasibilityVerdictTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    [Fact]
    public void FeasibilityVerdict_round_trips_json()
    {
        FeasibilityVerdict original = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Five-nines on a $15/month footprint is unlikely.",
            TransparencyTrail = new TransparencyTrail
            {
                Skipped =
                [
                    new SkippedQuestionTrailEntry
                    {
                        QuestionKey = "l0.pillar.reliability",
                        Tier = ElicitationQuestionTier.Must,
                    },
                ],
            },
            SoftEnvelope = new SoftInfeasibilityEnvelope
            {
                ConfidenceLow = 20,
                ConfidenceHigh = 55,
                EnvelopeDescription = "Reliability target may hold for dev/test only.",
                SoftAssumption = "No multi-AZ or geo-redundant dependencies budgeted.",
                CostOfBeingWrong = "Production outage exposure if reliability assumptions are wrong.",
            },
            UnsatCoreInvariantKeys = ["INV-004"],
            ProposedRelaxations =
            [
                new ProposedRelaxation
                {
                    InvariantKey = "INV-004",
                    TradeOffDescription = "Relax monthly LLM budget cap to allow redundant health probes.",
                },
            ],
        };

        string json = JsonSerializer.Serialize(original, JsonOptions);
        FeasibilityVerdict? back = JsonSerializer.Deserialize<FeasibilityVerdict>(json, JsonOptions);

        back.Should().NotBeNull();
        back!.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        back.SoftEnvelope!.ConfidenceHigh.Should().Be(55);
        back.UnsatCoreInvariantKeys.Should().ContainSingle().Which.Should().Be("INV-004");
        back.TransparencyTrail.HasSkippedMustQuestions.Should().BeTrue();
    }
}
