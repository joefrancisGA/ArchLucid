using ArchLucid.AgentRuntime.QuickScan;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.QuickScan;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeQuickScanCompletionJsonTests
{
    [Fact]
    public void Build_returns_valid_quick_scan_json_for_string_payload()
    {
        string json = FakeQuickScanCompletionJson.Build("""{"notes":"private endpoints and managed identity"}""");

        json.Should().Contain("\"summary\"");
        json.Should().Contain("\"findings\"");
        json.Should().Contain("private endpoints");
    }

    [Fact]
    public void Build_falls_back_when_payload_is_not_object_json()
    {
        string json = FakeQuickScanCompletionJson.Build("not-json");

        json.Should().Contain("Quick-scan input could not be summarized");
        json.Should().Contain("\"findings\"");
    }
}
