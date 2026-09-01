using System.ClientModel;
using System.Net;

using ArchLucid.AgentRuntime;

using FluentAssertions;

using Moq;

using System.ClientModel.Primitives;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureOpenAiMaxOutputTokenParameterPolicyTests
{
    [Fact]
    public void TryGetAlternateSerialization_when_max_tokens_unsupported_switches_to_max_completion_tokens()
    {
        ClientResultException ex = CreateBadRequest(
            "Parameter: max_tokens\nUnsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.");

        bool retry = AzureOpenAiMaxOutputTokenParameterPolicy.TryGetAlternateSerialization(
            ex,
            currentlyUsesMaxCompletionTokensProperty: false,
            out bool alternateUsesMaxCompletionTokensProperty);

        retry.Should().BeTrue();
        alternateUsesMaxCompletionTokensProperty.Should().BeTrue();
    }

    [Fact]
    public void TryGetAlternateSerialization_when_max_completion_tokens_unsupported_switches_to_max_tokens()
    {
        ClientResultException ex = CreateBadRequest(
            "Parameter: max_completion_tokens\nUnsupported parameter: 'max_completion_tokens' is not supported with this model. Use 'max_tokens' instead.");

        bool retry = AzureOpenAiMaxOutputTokenParameterPolicy.TryGetAlternateSerialization(
            ex,
            currentlyUsesMaxCompletionTokensProperty: true,
            out bool alternateUsesMaxCompletionTokensProperty);

        retry.Should().BeTrue();
        alternateUsesMaxCompletionTokensProperty.Should().BeFalse();
    }

    [Fact]
    public void TryGetAlternateSerialization_returns_false_for_unrelated_bad_request()
    {
        ClientResultException ex = CreateBadRequest("Parameter: temperature\nUnsupported value.");

        bool retry = AzureOpenAiMaxOutputTokenParameterPolicy.TryGetAlternateSerialization(
            ex,
            currentlyUsesMaxCompletionTokensProperty: true,
            out bool alternateUsesMaxCompletionTokensProperty);

        retry.Should().BeFalse();
        alternateUsesMaxCompletionTokensProperty.Should().BeTrue();
    }

    private static ClientResultException CreateBadRequest(string message)
    {
        Mock<PipelineResponse> response = new();
        response.SetupGet(r => r.Status).Returns((int)HttpStatusCode.BadRequest);

        return new ClientResultException(message, response.Object);
    }
}
