using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

/// <summary>
///     Unit tests for the transparency trail contract introduced in ADR 0050 (Phase 1C).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TransparencyTrailTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    [Fact]
    public void TransparencyTrail_DefaultCollections_AreEmpty()
    {
        TransparencyTrail trail = new();

        trail.Asserted.Should().BeEmpty();
        trail.Inferred.Should().BeEmpty();
        trail.Skipped.Should().BeEmpty();
        trail.HasSkippedMustQuestions.Should().BeFalse();
        trail.HasValidInferredConfidences.Should().BeTrue();
    }

    [Fact]
    public void HasSkippedMustQuestions_IsTrue_WhenMustTierSkipped()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = "q-encryption-at-rest",
                    Tier = ElicitationQuestionTier.Must,
                },
            ],
        };

        trail.HasSkippedMustQuestions.Should().BeTrue();
    }

    [Fact]
    public void HasSkippedMustQuestions_IsFalse_WhenOnlyShouldTierSkipped()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = "q-optional-detail",
                    Tier = ElicitationQuestionTier.Should,
                },
            ],
        };

        trail.HasSkippedMustQuestions.Should().BeFalse();
    }

    [Fact]
    public void HasValidInferredConfidences_IsFalse_WhenConfidenceOutOfRange()
    {
        TransparencyTrail trail = new()
        {
            Inferred =
            [
                new InferredTrailEntry
                {
                    Key = "actor.partner",
                    Value = "Machine / External / Event",
                    Confidence = 0,
                },
            ],
        };

        trail.HasValidInferredConfidences.Should().BeFalse();
    }

    [Fact]
    public void HasValidInferredConfidences_IsTrue_WhenAllConfidencesInRange()
    {
        TransparencyTrail trail = new()
        {
            Inferred =
            [
                new InferredTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Faster audit prep",
                    Confidence = 75,
                },
                new InferredTrailEntry
                {
                    Key = "actor.consumer",
                    Value = "Human / PublicAnonymous / Sync",
                    Confidence = 100,
                },
            ],
        };

        trail.HasValidInferredConfidences.Should().BeTrue();
    }

    [Fact]
    public void TransparencyTrail_round_trips_json()
    {
        TransparencyTrail original = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Reduce manual GRC review time by 50%",
                },
            ],
            Inferred =
            [
                new InferredTrailEntry
                {
                    Key = "actor.internal-ops",
                    Value = "Human / Internal / Sync",
                    Confidence = 60,
                },
            ],
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = "q-data-residency",
                    Tier = ElicitationQuestionTier.Should,
                },
            ],
        };

        string json = JsonSerializer.Serialize(original, JsonOptions);
        TransparencyTrail? back = JsonSerializer.Deserialize<TransparencyTrail>(json, JsonOptions);

        back.Should().NotBeNull();
        back.Asserted.Should().ContainSingle()
            .Which.Value.Should().Be(original.Asserted[0].Value);
        back.Inferred.Should().ContainSingle()
            .Which.Confidence.Should().Be(60);
        back.Skipped.Should().ContainSingle()
            .Which.Tier.Should().Be(ElicitationQuestionTier.Should);
        back.HasSkippedMustQuestions.Should().BeFalse();
        back.HasValidInferredConfidences.Should().BeTrue();
    }
}
