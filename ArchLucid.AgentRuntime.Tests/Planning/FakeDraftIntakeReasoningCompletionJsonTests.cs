using System.Text.Json;

using ArchLucid.AgentRuntime.Planning;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Planning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeDraftIntakeReasoningCompletionJsonTests
{
    [Fact]
    public void Build_returns_valid_intake_reasoning_json_with_gaps()
    {
        const string userPrompt = """
                                  Draft context JSON:
                                  {"systemName":"Vertex","businessOutcome":"faster and better","freeTextIntent":"Tenant migration platform"}

                                  Conversation history:
                                  (none)

                                  Latest message:
                                  What gaps or risks do you see in my intent and outcome before I start the architecture review?
                                  """;

        string json = FakeDraftIntakeReasoningCompletionJson.Build(userPrompt);

        using JsonDocument document = JsonDocument.Parse(json);
        string answer = document.RootElement.GetProperty("answer").GetString() ?? string.Empty;

        answer.Should().Contain("Vertex");
        answer.Should().Contain("faster and better");
        answer.Should().Contain("Gaps and risks");
        answer.Should().Contain("Business outcome is still vague");
        answer.Should().Contain("Simulator mode");
    }

    [Fact]
    public void Build_includes_constraint_and_assumption_gaps_when_arrays_empty()
    {
        const string userPrompt = """
                                  Draft context JSON:
                                  {"systemName":"Vertex","businessOutcome":"Reduce migration cutover risk by 40% within two quarters","constraints":[],"assumptions":[]}

                                  Latest message:
                                  what are your concerns about performance
                                  """;

        string json = FakeDraftIntakeReasoningCompletionJson.Build(userPrompt);

        json.Should().Contain("\"answer\"");
        json.Should().Contain("No explicit constraints captured yet");
        json.Should().Contain("Assumptions are empty");
    }
}
