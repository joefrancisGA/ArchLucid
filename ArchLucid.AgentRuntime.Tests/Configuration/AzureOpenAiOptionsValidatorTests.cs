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
    public void Validate_negative_max_completion_tokens_fails()
    {
        AzureOpenAiOptions options = new() { MaxCompletionTokens = -1 };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
    }
}
