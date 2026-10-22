using System.Text.Json;

using ArchLucid.AgentRuntime.Evaluation;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputJsonPropertyReaderTests
{
    [Fact]
    public void TryGetPropertyIgnoreCase_matches_property_name_ignoring_case()
    {
        using JsonDocument document = JsonDocument.Parse("""{"CLAIMS":[{"text":"x"}]}""");

        bool found = AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(
            document.RootElement,
            "claims",
            out JsonElement claims);

        found.Should().BeTrue();
        claims.ValueKind.Should().Be(JsonValueKind.Array);
        claims.GetArrayLength().Should().Be(1);
    }
}
