using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ClarificationAnswerRephraseServiceTests
{
    [Fact]
    public async Task RephraseAsync_returns_humanized_answers_from_llm_json()
    {
        const string json = """
                            {
                              "answers": [
                                {
                                  "questionKey": "l0.actor.additional-kinds",
                                  "rephrasedAnswer": "Yes — partner integrations and service accounts also call the API."
                                }
                              ]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 900, 0.2f, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ClarificationAnswerRephraseService sut = new(client.Object, NullLogger<ClarificationAnswerRephraseService>.Instance);

        RephraseClarificationAnswersResponse response = await sut.RephraseAsync(
            new RephraseClarificationAnswersInput
            {
                Items =
                [
                    new ClarificationAnswerRephraseItem
                    {
                        QuestionKey = "l0.actor.additional-kinds",
                        QuestionPrompt =
                            "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
                        ExtractedAnswer = "Partner integrations and service accounts also call the API.",
                    },
                ],
            },
            CancellationToken.None);

        response.RephrasedAnswers["l0.actor.additional-kinds"]
            .Should()
            .Be("Yes — partner integrations and service accounts also call the API.");
    }

    [Fact]
    public async Task RephraseAsync_falls_back_to_extracted_text_when_llm_fails()
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 900, 0.2f, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated outage"));

        ClarificationAnswerRephraseService sut = new(client.Object, NullLogger<ClarificationAnswerRephraseService>.Instance);

        RephraseClarificationAnswersResponse response = await sut.RephraseAsync(
            new RephraseClarificationAnswersInput
            {
                Items =
                [
                    new ClarificationAnswerRephraseItem
                    {
                        QuestionKey = "l0.pillar.security",
                        QuestionPrompt = "What data sensitivity, regulatory scope, or trust boundaries apply?",
                        ExtractedAnswer = "PCI-DSS scope for cardholder data.",
                    },
                ],
            },
            CancellationToken.None);

        response.RephrasedAnswers["l0.pillar.security"].Should().Be("PCI-DSS scope for cardholder data.");
    }

    [Fact]
    public void BuildUserPrompt_includes_question_key_prompt_and_extracted_answer()
    {
        string prompt = ClarificationAnswerRephraseService.BuildUserPrompt(
        [
            new ClarificationAnswerRephraseItem
            {
                QuestionKey = "l0.actor.additional-kinds",
                QuestionPrompt = "Are there other kinds of users?",
                ExtractedAnswer = "Partner integrations and service accounts also call the API.",
            },
        ]);

        prompt.Should().Contain("questionKey: l0.actor.additional-kinds");
        prompt.Should().Contain("questionPrompt: Are there other kinds of users?");
        prompt.Should().Contain("extractedAnswer: Partner integrations and service accounts also call the API.");
    }

    [Theory]
    [InlineData("RPO 15 minutes and RTO 4 hours.", "We need RPO 15 minutes and RTO 4 hours.", true)]
    [InlineData("RPO 15 minutes and RTO 4 hours.", "We need fast recovery.", false)]
    [InlineData("Readable answer.", "...", false)]
    public void IsUsableRephrase_preserves_numeric_facts(
        string extractedAnswer,
        string rephrasedAnswer,
        bool expected)
    {
        ClarificationAnswerRephraseService.IsUsableRephrase(extractedAnswer, rephrasedAnswer).Should().Be(expected);
    }
}
