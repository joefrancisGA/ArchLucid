using ArchLucid.Application.Planning;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRequestDraftSemanticUniquePassTests
{
    [Theory]
    [InlineData("Support for mobile and web", "Mobile and web support")]
    [InlineData("Stable internet connection", "Constant internet access")]
    [InlineData("Users have basic computer skills", "Tech-literate users")]
    [InlineData("All user data must be encrypted", "Stored data must be encrypted")]
    public async Task FilterDuplicatesAsync_drops_semantic_duplicate_within_batch(
        string first,
        string second)
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildDropSecondDecisionJson(first, second));

        ArchitectureRequestDraftSemanticUniquePass sut = new(client.Object);

        string[] result = await sut.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Constraints,
            [],
            [first, second],
            CancellationToken.None);

        result.Should().ContainSingle().Which.Should().Be(first);
    }

    [Theory]
    [InlineData("Encryption at rest", "Encryption in transit")]
    [InlineData("99.9% uptime", "10k concurrent users")]
    [InlineData("Data residency", "SOC 2")]
    [InlineData("React frontend", "Java backend")]
    public async Task FilterDuplicatesAsync_keeps_related_but_distinct_items(
        string first,
        string second)
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildKeepAllDecisionJson(first, second));

        ArchitectureRequestDraftSemanticUniquePass sut = new(client.Object);

        string[] result = await sut.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Constraints,
            [],
            [first, second],
            CancellationToken.None);

        result.Should().Equal(first, second);
    }

    [Fact]
    public async Task FilterDuplicatesAsync_drops_candidate_semantically_duplicate_of_existing_item()
    {
        const string existing = "Support for mobile and web";
        const string candidate = "Mobile and web support";

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                $$"""
                  {
                    "decisions": [
                      { "candidate": "{{candidate}}", "decision": "drop", "duplicateOf": "{{existing}}" }
                    ]
                  }
                  """);

        ArchitectureRequestDraftSemanticUniquePass sut = new(client.Object);

        string[] result = await sut.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Constraints,
            [existing],
            [candidate],
            CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FilterDuplicatesAsync_exact_match_drops_without_llm_when_only_one_candidate_remains()
    {
        Mock<IAgentCompletionClient> client = new();

        ArchitectureRequestDraftSemanticUniquePass sut = new(client.Object);

        string[] result = await sut.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Assumptions,
            ["Stable internet connection"],
            ["stable internet connection"],
            CancellationToken.None);

        result.Should().BeEmpty();
        client.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task FilterDuplicatesAsync_keeps_all_candidates_when_llm_returns_invalid_json()
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("not json");

        ArchitectureRequestDraftSemanticUniquePass sut = new(client.Object);

        string[] result = await sut.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Assumptions,
            [],
            ["Stable internet connection", "Constant internet access"],
            CancellationToken.None);

        result.Should().Equal("Stable internet connection", "Constant internet access");
    }

    [Fact]
    public void BuildUserPrompt_includes_list_kind_and_anchor_items()
    {
        string prompt = ArchitectureRequestDraftSemanticUniquePass.BuildUserPrompt(
            ArchitectureRequestDraftListKind.Assumptions,
            ["Existing assumption"],
            ["Candidate A", "Candidate B"]);

        prompt.Should().Contain("List kind: assumptions");
        prompt.Should().Contain("Existing assumption");
        prompt.Should().Contain("Candidate A");
        prompt.Should().Contain("Candidate B");
    }

    [Fact]
    public void ApplyDecisions_keeps_when_decision_missing_for_candidate()
    {
        string[] result = ArchitectureRequestDraftSemanticUniquePass.ApplyDecisions(
            ["Keep me"],
            []);

        result.Should().ContainSingle().Which.Should().Be("Keep me");
    }

    private static string BuildDropSecondDecisionJson(string first, string second)
    {
        return $$"""
                 {
                   "decisions": [
                     { "candidate": "{{first}}", "decision": "keep", "duplicateOf": null },
                     { "candidate": "{{second}}", "decision": "drop", "duplicateOf": "{{first}}" }
                   ]
                 }
                 """;
    }

    private static string BuildKeepAllDecisionJson(string first, string second)
    {
        return $$"""
                 {
                   "decisions": [
                     { "candidate": "{{first}}", "decision": "keep", "duplicateOf": null },
                     { "candidate": "{{second}}", "decision": "keep", "duplicateOf": null }
                   ]
                 }
                 """;
    }
}
