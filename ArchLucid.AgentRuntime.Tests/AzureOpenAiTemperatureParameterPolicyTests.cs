using System.ClientModel;
using System.Net;

using ArchLucid.AgentRuntime;

using FluentAssertions;

using Moq;

using OpenAI.Chat;

using System.ClientModel.Primitives;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureOpenAiTemperatureParameterPolicyTests
{
    [Fact]
    public void TryOmitTemperature_returns_true_for_unsupported_temperature_value()
    {
        ClientResultException ex = CreateBadRequest(
            "HTTP 400 (invalid_request_error: unsupported_value) Parameter: temperature Unsupported value: 'temperature' does not support 0 with this model. Only the default (1) value is supported.");

        AzureOpenAiTemperatureParameterPolicy.TryOmitTemperature(ex).Should().BeTrue();
    }

    [Fact]
    public void TryOmitTemperature_returns_false_for_unrelated_bad_request()
    {
        ClientResultException ex = CreateBadRequest("Parameter: max_tokens\nUnsupported parameter.");

        AzureOpenAiTemperatureParameterPolicy.TryOmitTemperature(ex).Should().BeFalse();
    }

    [Fact]
    public void Omit_clears_temperature_on_options()
    {
        ChatCompletionOptions options = AzureOpenAiMaxOutputTokenParameterPolicy.CreateOptions();
        options.Temperature = 0.1f;

        AzureOpenAiTemperatureParameterPolicy.Omit(options);

        options.Temperature.Should().BeNull();
    }

    private static ClientResultException CreateBadRequest(string message)
    {
        Mock<PipelineResponse> response = new();
        response.SetupGet(r => r.Status).Returns((int)HttpStatusCode.BadRequest);

        return new ClientResultException(message, response.Object);
    }
}
