using ArchLucid.AgentRuntime.Planning;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Planning;

[Trait("Category", "Unit")]
public sealed class FakeClarificationAnswerRephraseCompletionJsonTests
{
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
