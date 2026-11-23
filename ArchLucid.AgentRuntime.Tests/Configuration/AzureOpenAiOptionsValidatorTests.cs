using ArchLucid.AgentRuntime;

using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class AzureOpenAiOptionsValidatorTests
{
    private readonly AzureOpenAiOptionsValidator _sut = new();

    [Fact]
    public void Validate_default_options_succeeds()
    {
        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, new AzureOpenAiOptions());

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_partial_credentials_fails_when_endpoint_missing()
    {
        AzureOpenAiOptions options = new()
        {
            ApiKey = "key",
            DeploymentName = "gpt-4o",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains(nameof(AzureOpenAiOptions.Endpoint), StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_complete_credentials_with_invalid_endpoint_fails()
    {
        AzureOpenAiOptions options = new()
        {
            Endpoint = "not-a-uri",
            ApiKey = "key",
            DeploymentName = "gpt-4o",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("absolute URI", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_complete_credentials_with_valid_endpoint_succeeds()
    {
        AzureOpenAiOptions options = new()
        {
            Endpoint = "https://example.openai.azure.com/",
            ApiKey = "key",
            DeploymentName = "gpt-4o",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_managed_identity_credentials_without_api_key_succeeds()
    {
        AzureOpenAiOptions options = new()
        {
            Endpoint = "https://example.openai.azure.com/",
            DeploymentName = "gpt-4o",
            AuthenticationMode = "ManagedIdentity",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    [InlineData(181)]
    public void Validate_completion_network_timeout_outside_allowed_range_fails(int seconds)
    {
        AzureOpenAiOptions options = new() { CompletionNetworkTimeoutSeconds = seconds };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(message =>
            message.Contains(nameof(AzureOpenAiOptions.CompletionNetworkTimeoutSeconds), StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(5)]
    [InlineData(60)]
    [InlineData(180)]
    public void Validate_bounded_completion_network_timeout_succeeds(int seconds)
    {
        AzureOpenAiOptions options = new() { CompletionNetworkTimeoutSeconds = seconds };

        _sut.Validate(Options.DefaultName, options).Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_negative_max_completion_tokens_fails()
    {
        AzureOpenAiOptions options = new() { MaxCompletionTokens = -1 };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
    }
}
