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

    private enum SampleStatus
    {
        Unknown,
        Ready,
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

    [Fact]
    public void DeserializeStringListOrEmpty_returns_empty_when_json_blank()
    {
        RelationalSliceReadCore.DeserializeStringListOrEmpty(null).Should().BeEmpty();
    }

    [Fact]
    public void DeserializeOrdinalStringDictionaryOrEmpty_uses_ordinal_comparer()
    {
        Dictionary<string, string> parsed = RelationalSliceReadCore.DeserializeOrdinalStringDictionaryOrEmpty(
            """{"alpha":"1","beta":"2"}""");

        parsed.Comparer.Should().BeSameAs(StringComparer.Ordinal);
        parsed["alpha"].Should().Be("1");
    }

    [Fact]
    public void ParseEnumOrDefault_returns_fallback_for_unknown_value()
    {
        RelationalSliceReadCore.ParseEnumOrDefault("missing", SampleStatus.Unknown)
            .Should()
            .Be(SampleStatus.Unknown);
    }

    [Fact]
    public void ParseEnumOrDefault_parses_case_insensitive_value()
    {
        RelationalSliceReadCore.ParseEnumOrDefault("ready", SampleStatus.Unknown)
            .Should()
            .Be(SampleStatus.Ready);
    }
}
