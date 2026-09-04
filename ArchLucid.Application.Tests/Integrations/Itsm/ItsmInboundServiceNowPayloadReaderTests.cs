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
}
