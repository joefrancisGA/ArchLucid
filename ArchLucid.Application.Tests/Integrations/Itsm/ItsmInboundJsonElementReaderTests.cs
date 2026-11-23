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

    [Theory]
    [InlineData("1e20")]
    [InlineData("-1e20")]
    [InlineData("9223372036854775808")]
    [InlineData("-9223372036854775809")]
    public void ReadStringOrRawText_preserves_numeric_status_outside_int64_range(string value)
    {
        using JsonDocument document = JsonDocument.Parse($"{{\"state\":{value}}}");

        string? status = ItsmInboundJsonElementReader.ReadStringOrRawText(
            document.RootElement.GetProperty("state"));

        status.Should().Be(value, "unrepresentable vendor numeric IDs must not silently wrap to a different status");
    }

    [Theory]
    [InlineData("1e20")]
    [InlineData("-1e20")]
    [InlineData("9223372036854775808")]
    [InlineData("-9223372036854775809")]
    public void NormalizeStatusText_preserves_out_of_range_numeric_status(string value)
    {
        ItsmInboundJsonElementReader.NormalizeStatusText(value).Should().Be(value);
    }

    [Theory]
    [InlineData("6.0", "6")]
    [InlineData("-6e0", "-6")]
    [InlineData("-9223372036854775808", "-9223372036854775808")]
    public void NormalizeStatusText_retains_valid_in_range_numeric_status(string value, string expected)
    {
        ItsmInboundJsonElementReader.NormalizeStatusText(value).Should().Be(expected);
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
