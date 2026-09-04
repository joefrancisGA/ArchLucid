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
}
