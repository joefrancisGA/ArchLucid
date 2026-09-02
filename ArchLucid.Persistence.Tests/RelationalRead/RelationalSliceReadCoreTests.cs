using ArchLucid.Persistence.RelationalRead;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.RelationalRead;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RelationalSliceReadCoreTests
{
    private sealed class SampleSection
    {
        public string Name { get; init; } = string.Empty;
    }

    [Fact]
    public void DeserializeOrNew_returns_new_when_json_blank()
    {
        SampleSection section = RelationalSliceReadCore.DeserializeOrNew<SampleSection>(
            null,
            static _ => new SampleSection { Name = "ignored" });

        section.Name.Should().BeEmpty();
    }

    [Fact]
    public void DeserializeOrNew_returns_deserialized_value()
    {
        SampleSection section = RelationalSliceReadCore.DeserializeOrNew(
            """{"Name":"topology"}""",
            static json => System.Text.Json.JsonSerializer.Deserialize<SampleSection>(json)!);

        section.Name.Should().Be("topology");
    }

    [Fact]
    public void DeserializeOrNew_returns_new_on_invalid_operation()
    {
        SampleSection section = RelationalSliceReadCore.DeserializeOrNew<SampleSection>(
            "{}",
            static _ => throw new InvalidOperationException("bad json"));

        section.Name.Should().BeEmpty();
    }
}
