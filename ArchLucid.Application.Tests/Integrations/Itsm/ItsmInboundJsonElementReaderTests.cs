using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Category", "Unit")]
public sealed class ItsmInboundJsonElementReaderTests
{
    [Fact]
    public void ReadStringOrRawText_normalizes_whole_number_json_floats_to_integer_status_text()
    {
        using JsonDocument document = JsonDocument.Parse("""{"state":6.0}""");

        string? value = ItsmInboundJsonElementReader.ReadStringOrRawText(document.RootElement.GetProperty("state"));

        value.Should().Be("6");
    }

    [Fact]
    public void NormalizeStatusText_canonicalizes_whole_number_float_strings()
    {
        ItsmInboundJsonElementReader.NormalizeStatusText("6.0").Should().Be("6");
        ItsmInboundJsonElementReader.NormalizeStatusText("06").Should().Be("6");
    }

    [Fact]
    public void ReadStringOrRawText_returns_null_for_json_null()
    {
        using JsonDocument document = JsonDocument.Parse("""{"state":null}""");

        string? value = ItsmInboundJsonElementReader.ReadStringOrRawText(document.RootElement.GetProperty("state"));

        value.Should().BeNull();
    }

    [Fact]
    public void TryGetPropertyCaseInsensitive_returns_false_when_root_is_json_array()
    {
        using JsonDocument document = JsonDocument.Parse("""[1,2,3]""");

        bool found = ItsmInboundJsonElementReader.TryGetPropertyCaseInsensitive(
            document.RootElement,
            "sys_id",
            out JsonElement _);

        found.Should().BeFalse("vendor webhook roots must be JSON objects before property lookup");
    }
}
