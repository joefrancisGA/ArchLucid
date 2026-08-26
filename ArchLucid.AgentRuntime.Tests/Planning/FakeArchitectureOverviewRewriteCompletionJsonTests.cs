using ArchLucid.AgentRuntime.Planning;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Planning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeArchitectureOverviewRewriteCompletionJsonTests
{
    [Fact]
    public void Build_returns_valid_overview_rewrite_json_with_grounding()
    {
        const string userPrompt = """
                                  System name: Vertex
                                  Business outcome: faster and better

                                  Current architecture overview:
                                  Tenant migration platform with private networking.

                                  Confirmed constraints:
                                  - EU data residency
                                  - Private networking required

                                  Confirmed assumptions:
                                  - Shared DB with TenantId
                                  """;

        string json = FakeArchitectureOverviewRewriteCompletionJson.Build(userPrompt);

        json.Should().Contain("\"rewrittenOverview\"");
        json.Should().Contain("Vertex");
        json.Should().Contain("faster and better");
        json.Should().Contain("Tenant migration platform");
        json.Should().Contain("EU data residency");
        json.Should().Contain("Simulator mode");
    }

    [Fact]
    public void Build_returns_fallback_when_overview_section_missing()
    {
        string json = FakeArchitectureOverviewRewriteCompletionJson.Build("System name: Vertex");

        json.Should().Contain("\"rewrittenOverview\"");
        json.Should().Contain("Architecture overview grounded from the confirmed structured brief");
    }
}
