using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmTelemetryAndMeteringOptionsTests
{
    [Fact]
    public void LlmTelemetryOptions_and_MeteringOptions_expose_section_names_and_flags()
    {
        LlmTelemetryOptions.SectionName.Should().Be("LlmTelemetry");
        MeteringOptions.SectionName.Should().Be("Metering");

        LlmTelemetryOptions telemetry = new()
        {
            RecordPerTenantTokens = true,
            CapturePromptResponseOnSpans = true,
        };

        telemetry.RecordPerTenantTokens.Should().BeTrue();
        telemetry.CapturePromptResponseOnSpans.Should().BeTrue();

        MeteringOptions metering = new() { Enabled = true };

        metering.Enabled.Should().BeTrue();
    }
}
