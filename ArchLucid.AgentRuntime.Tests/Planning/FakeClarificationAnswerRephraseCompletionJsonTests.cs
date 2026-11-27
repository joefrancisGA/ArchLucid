using System.Text.Json;

using ArchLucid.AgentRuntime.Planning;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Planning;

[Trait("Category", "Unit")]
public sealed class FakeClarificationAnswerRephraseCompletionJsonTests
{
    [Theory]
    [InlineData("→")]
    [InlineData("—")]
    [InlineData("-")]
    public void Build_omits_truncated_answer_and_preserves_complete_sibling(string danglingPunctuation)
    {
        string userPrompt = $$"""
                              Question 1:
                              questionKey: truncated
                              questionPrompt: Where does the request go next?
                              extractedAnswer: The request is forwarded to {{danglingPunctuation}}

                              Question 2:
                              questionKey: complete
                              questionPrompt: Who reviews the request?
                              extractedAnswer: The operations team reviews the request
                              """;

        using JsonDocument response = JsonDocument.Parse(FakeClarificationAnswerRephraseCompletionJson.Build(userPrompt));
        JsonElement.ArrayEnumerator answers = response.RootElement.GetProperty("answers").EnumerateArray();
        Assert.True(answers.MoveNext());
        Assert.Equal("complete", answers.Current.GetProperty("questionKey").GetString());
        Assert.Equal("The operations team reviews the request.", answers.Current.GetProperty("rephrasedAnswer").GetString());
        Assert.False(answers.MoveNext());
    }

    [Fact]
    public void Build_returns_answers_json_not_topology_agent_result()
    {
        string userPrompt = """
                            Question 1:
                            questionKey: l0.actor.additional-kinds
                            questionPrompt: Are there other kinds of users (human or machine) that interact with this system besides those already identified?
                            extractedAnswer: Actors Actor How they touch the system Operators / architects Browser — workspace Diagram —

                            """;

        string json = FakeClarificationAnswerRephraseCompletionJson.Build(userPrompt);

        json.Should().Contain("\"answers\"");
        json.Should().Contain("l0.actor.additional-kinds");
        json.Should().NotContain("\"agentType\"");
    }
}
