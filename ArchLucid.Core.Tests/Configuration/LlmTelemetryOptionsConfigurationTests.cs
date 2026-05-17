using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class LlmTelemetryOptionsConfigurationTests
{
    [Fact]
    public void LlmTelemetryOptions_defaults_CapturePromptResponseOnSpans_false()
    {
        LlmTelemetryOptions sut = new();

        sut.CapturePromptResponseOnSpans.Should().BeFalse();

        sut.RecordPerTenantTokens.Should().BeFalse();
    }

    [Fact]
    public void LlmTelemetryOptions_section_binds_CapturePromptResponseOnSpans_when_true()
    {
        Dictionary<string, string?> data = new()
        {

            [$"{LlmTelemetryOptions.SectionName}:CapturePromptResponseOnSpans"] = "true",

            [$"{LlmTelemetryOptions.SectionName}:RecordPerTenantTokens"] = "true"
        };


        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        LlmTelemetryOptions? bound = cfg.GetSection(LlmTelemetryOptions.SectionName).Get<LlmTelemetryOptions>();

        bound.Should().NotBeNull();


        bound!.CapturePromptResponseOnSpans.Should().BeTrue();

        bound.RecordPerTenantTokens.Should().BeTrue();
    }

}
