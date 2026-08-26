using System.Text.Json;

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

    [Fact]
    public void Build_preserves_full_overview_beyond_former_four_thousand_character_clip()
    {
        const string headMarker = "HEAD-MARKER ";
        const string tailMarker = " TAIL-MARKER";
        string overview = headMarker + new string('x', 5_000) + tailMarker;
        string userPrompt =
            "System name: Vertex" +
            Environment.NewLine +
            "Business outcome: faster and better" +
            Environment.NewLine +
            Environment.NewLine +
            "Current architecture overview:" +
            Environment.NewLine +
            overview;

        string json = FakeArchitectureOverviewRewriteCompletionJson.Build(userPrompt);

        using JsonDocument document = JsonDocument.Parse(json);
        string rewritten = document.RootElement.GetProperty("rewrittenOverview").GetString() ?? string.Empty;

        rewritten.Should().Contain(headMarker);
        rewritten.Should().Contain(tailMarker);
        rewritten.Should().Contain(overview);
        rewritten.Should().NotContain("…");
    }

    [Fact]
    public void Build_is_idempotent_when_current_overview_already_contains_simulator_intro()
    {
        const string userPrompt = """
                                  System name: Vertex
                                  Business outcome: faster and better

                                  Current architecture overview:
                                  Vertex — Business outcome: faster and better. Vertex — Business outcome: faster and better.
                                  Tenant migration platform with private networking.

                                  Confirmed constraints:
                                  - EU data residency
                                  """;

        string json = FakeArchitectureOverviewRewriteCompletionJson.Build(userPrompt);

        using JsonDocument document = JsonDocument.Parse(json);
        string rewritten = document.RootElement.GetProperty("rewrittenOverview").GetString() ?? string.Empty;

        int introCount = CountOccurrences(
            rewritten,
            "Vertex — Business outcome: faster and better.");

        introCount.Should().Be(1);
        rewritten.Should().Contain("Tenant migration platform with private networking");
    }

    [Fact]
    public void StripSimulatorGeneratedArtifacts_removes_repeated_prefixes_and_footer()
    {
        const string overview = """
                                Vertex — Business outcome: faster and better. Vertex — Business outcome: faster and better.
                                Core narrative body.

                                (Simulator mode — deterministic rewrite from the confirmed structured brief. Connect a live LLM deployment for production-quality narrative polish.)
                                """;

        string stripped = FakeArchitectureOverviewRewriteCompletionJson.StripSimulatorGeneratedArtifacts(
            overview,
            "Vertex",
            "faster and better");

        stripped.Should().Be("Core narrative body.");
    }

    private static int CountOccurrences(string haystack, string needle)
    {
        int count = 0;
        int index = 0;

        while ((index = haystack.IndexOf(needle, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += needle.Length;
        }

        return count;
    }
}
