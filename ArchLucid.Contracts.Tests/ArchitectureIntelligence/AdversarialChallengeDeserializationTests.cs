using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AdversarialChallengeDeserializationTests
{
    [Fact]
    public void Deserialize_null_narrative_strings_yield_empty_strings_not_null()
    {
        const string json = """
            {
              "challengeId": null,
              "hypothesis": null,
              "falsificationEvidenceNeeded": null,
              "confidence": 0.5,
              "lane": 0
            }
            """;

        AdversarialChallenge? challenge =
            JsonSerializer.Deserialize<AdversarialChallenge>(json, ContractJson.CamelCaseCompact);

        challenge.Should().NotBeNull();
        challenge!.ChallengeId.Should().BeEmpty();
        challenge.Hypothesis.Should().BeEmpty();
        challenge.FalsificationEvidenceNeeded.Should().BeEmpty();
    }
}