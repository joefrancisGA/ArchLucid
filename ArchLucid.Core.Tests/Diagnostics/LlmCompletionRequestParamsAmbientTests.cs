using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmCompletionRequestParamsAmbientTests
{
    [Fact]
    public void TryConsume_returns_null_temperature_when_not_sent()
    {
        LlmCompletionRequestParamsAmbient.Clear();
        LlmCompletionRequestParamsAmbient.Record(maxOutputTokens: 256);

        LlmCompletionRequestParamsAmbient.TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP);

        temperature.Should().BeNull();
        maxOutputTokens.Should().Be(256);
        topP.Should().BeNull();
    }

    [Fact]
    public void TryConsume_returns_explicit_temperature_when_sent()
    {
        LlmCompletionRequestParamsAmbient.Clear();
        LlmCompletionRequestParamsAmbient.Record(maxOutputTokens: 512, temperature: 0.2f, topP: 0.9f);

        LlmCompletionRequestParamsAmbient.TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP);

        temperature.Should().Be(0.2f);
        maxOutputTokens.Should().Be(512);
        topP.Should().Be(0.9f);
    }
}
