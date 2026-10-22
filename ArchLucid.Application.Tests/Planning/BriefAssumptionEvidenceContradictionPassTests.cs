using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BriefAssumptionEvidenceContradictionPassTests
{
    [Fact]
    public async Task DetectAsync_maps_contradicted_confirmed_assumptions()
    {
        const string overview = "Multi-region active-active deployment across US and EU with no single-region pilot.";
        const string assumption = "Single-region pilot";

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                """
                {
                  "contradictions": [
                    {
                      "assumption": "Single-region pilot",
                      "evidenceNote": "Overview describes multi-region active-active deployment."
                    }
                  ]
                }
                """);

        BriefAssumptionEvidenceContradictionPass sut = new(client.Object);

        IReadOnlyList<EvidenceContradictedBriefAssumption> contradictions = await sut.DetectAsync(
            overview,
            [assumption],
            CancellationToken.None);

        contradictions.Should().ContainSingle();
        contradictions[0].Assumption.Should().Be(assumption);
        contradictions[0].EvidenceNote.Should().Contain("multi-region");
    }

    [Fact]
    public async Task DetectAsync_skips_unknown_sentinel_assumptions()
    {
        BriefAssumptionEvidenceContradictionPass sut = new(Mock.Of<IAgentCompletionClient>());

        IReadOnlyList<EvidenceContradictedBriefAssumption> contradictions = await sut.DetectAsync(
            "Long enough overview text for contradiction detection.",
            ["Unknown — confirm before review"],
            CancellationToken.None);

        contradictions.Should().BeEmpty();
    }

    [Fact]
    public void MapContradictions_ignores_items_not_in_confirmed_list()
    {
        List<EvidenceContradictedBriefAssumption> mapped = BriefAssumptionEvidenceContradictionPass.MapContradictions(
            ["Single-region pilot"],
            [
                new BriefAssumptionEvidenceContradictionPass.ContradictionShape
                {
                    Assumption = "Dedicated SRE on-call",
                    EvidenceNote = "Developers handle incidents.",
                },
            ]);

        mapped.Should().BeEmpty();
    }
}
