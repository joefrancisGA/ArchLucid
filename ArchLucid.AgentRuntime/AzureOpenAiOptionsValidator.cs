using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Ensures <see cref="AzureOpenAiOptions.MaxCompletionTokens" /> resolves to a positive cap at runtime (zero uses
///     <see cref="AzureOpenAiOptions.DefaultMaxCompletionTokens" />).
/// </summary>
public sealed class AzureOpenAiOptionsValidator : IValidateOptions<AzureOpenAiOptions>
{
    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, AzureOpenAiOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        if (options.MaxCompletionTokens < 0)
        {
            return ValidateOptionsResult.Fail(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.MaxCompletionTokens)} must be zero or greater.");
        }

        if (options.MaxRetries < 0)
        {
            return ValidateOptionsResult.Fail(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.MaxRetries)} must be zero or greater.");
        }

        int effectiveMaxCompletionTokens = options.MaxCompletionTokens <= 0
            ? AzureOpenAiOptions.DefaultMaxCompletionTokens
            : options.MaxCompletionTokens;

        if (effectiveMaxCompletionTokens <= 0)
        {
            return ValidateOptionsResult.Fail(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.MaxCompletionTokens)} must resolve to a value greater than zero.");
        }

        List<string> credentialFailures = ValidateCredentialFields(options);

        if (credentialFailures.Count > 0)
            return ValidateOptionsResult.Fail(credentialFailures);

        return ValidateOptionsResult.Success;
    }

    private static List<string> ValidateCredentialFields(AzureOpenAiOptions options)
    {
        List<string> failures = [];
        bool hasEndpoint = !string.IsNullOrWhiteSpace(options.Endpoint);
        bool hasApiKey = !string.IsNullOrWhiteSpace(options.ApiKey);
        bool hasDeployment = !string.IsNullOrWhiteSpace(options.DeploymentName);

        if (!hasEndpoint && !hasApiKey && !hasDeployment)
            return failures;

        if (!hasEndpoint)
        {
            failures.Add(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.Endpoint)} is required when Azure OpenAI credentials are partially configured.");
        }

        if (!hasApiKey)
        {
            failures.Add(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.ApiKey)} is required when Azure OpenAI credentials are partially configured.");
        }

        if (!hasDeployment)
        {
            failures.Add(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.DeploymentName)} is required when Azure OpenAI credentials are partially configured.");
        }

        if (hasEndpoint && !Uri.TryCreate(options.Endpoint.Trim(), UriKind.Absolute, out _))
        {
            failures.Add(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.Endpoint)} must be an absolute URI when set.");
        }

        return failures;
    }
}
