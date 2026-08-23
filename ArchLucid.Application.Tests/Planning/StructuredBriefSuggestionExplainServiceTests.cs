using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredBriefSuggestionExplainServiceTests
{
    private const string SourceText =
        "Architecture overview:\nTenant migration platform with private networking and EU residency goals for customers in Germany.";

    [Fact]
    public async Task ExplainAsync_parses_llm_json_and_returns_explanation()
    {
        const string json = """
                            {
                              "explanation": "Your overview mentioned EU customers. Confirming this tells the review to store and process personal data in EU regions only."
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                400,
                0.2f,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        StructuredBriefSuggestionExplainService sut = new(client.Object);

        ExplainStructuredBriefSuggestionResponse response = await sut.ExplainAsync(
            new ExplainStructuredBriefSuggestionInput
            {
                SourceText = SourceText,
                SuggestionKind = StructuredBriefSuggestionKind.Constraint,
                SuggestionText = "EU data residency",
            },
            CancellationToken.None);

        response.Explanation.Should().Contain("EU customers");
    }

    [Fact]
    public async Task ExplainAsync_returns_cached_explanation_without_second_llm_call()
    {
        const string json = """
                            {
                              "explanation": "Cached explanation text for EU data residency constraint."
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                400,
                0.2f,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        StructuredBriefSuggestionExplainService sut = new(client.Object);

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = SourceText,
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "EU data residency",
        };

        ExplainStructuredBriefSuggestionResponse first = await sut.ExplainAsync(input, CancellationToken.None);
        ExplainStructuredBriefSuggestionResponse second = await sut.ExplainAsync(input, CancellationToken.None);

        first.Explanation.Should().Be(second.Explanation);
        client.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                400,
                0.2f,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void BuildCacheKey_is_case_insensitive_for_suggestion_text()
    {
        string lower = StructuredBriefSuggestionExplainService.BuildCacheKey(
            StructuredBriefSuggestionKind.Assumption,
            "single-region pilot",
            SourceText);

        string upper = StructuredBriefSuggestionExplainService.BuildCacheKey(
            StructuredBriefSuggestionKind.Assumption,
            "Single-Region Pilot",
            SourceText);

        lower.Should().Be(upper);
    }
}
