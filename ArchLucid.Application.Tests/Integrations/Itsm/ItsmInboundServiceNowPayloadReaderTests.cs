using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundServiceNowPayloadReaderTests
{
    private const string SysId = "a1b2c3d4e5f6789012345678abcdef01";

    [Fact]
    public void TryRead_accepts_uppercase_hex_sys_id()
    {
        const string upperSysId = "A1B2C3D4E5F6789012345678ABCDEF01";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{"sys_id":"{{upperSysId}}","state":"6"}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.ExternalKey.Should().Be(upperSysId);
    }

    [Fact]
    public void TryRead_accepts_PascalCase_sys_id_and_state()
    {
        using JsonDocument document = JsonDocument.Parse(
            $$"""{"Sys_Id":"{{SysId}}","State":"6"}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.ExternalKey.Should().Be(SysId);
        result.StatusValue.Should().Be("6");
    }

    [Fact]
    public void TryRead_accepts_PascalCase_sysId_and_incident_state()
    {
        using JsonDocument document = JsonDocument.Parse(
            $$"""{"SysId":"{{SysId}}","Incident_State":"6"}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.ExternalKey.Should().Be(SysId);
        result.StatusValue.Should().Be("6");
    }

    [Fact]
    public void TryRead_exposes_incident_state_as_alternate_when_state_is_present_but_differs()
    {
        using JsonDocument document = JsonDocument.Parse(
            $$"""{"sys_id":"{{SysId}}","state":"4","incident_state":"6"}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.StatusValue.Should().Be("4");
        result.AlternateStatusValue.Should().Be("6");
    }

    [Fact]
    public void TryRead_accepts_numeric_incident_state()
    {
        using JsonDocument document = JsonDocument.Parse(
            $$"""{"sys_id":"{{SysId}}","incident_state":6}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult result);

        ok.Should().BeTrue();
        result.StatusValue.Should().Be("6");
    }

    [Fact]
    public void TryRead_rejects_numeric_sys_id_without_throwing()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"sys_id":12345,"state":"6"}""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult _);

        ok.Should().BeFalse("ServiceNow sys_id is a string token; malformed JSON must be rejected rather than throwing");
    }

    [Fact]
    public void TryRead_rejects_non_object_json_without_throwing()
    {
        using JsonDocument document = JsonDocument.Parse("""["not-a-webhook-object"]""");

        bool ok = new ItsmInboundServiceNowPayloadReader().TryRead(document.RootElement, out ItsmInboundPayloadReadResult _);

        ok.Should().BeFalse("valid JSON with the wrong top-level shape must be rejected rather than throwing");
    }
}
