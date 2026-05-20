using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

public sealed class AzureOpenAiOptionsValidator : IValidateOptions<AzureOpenAiOptions>
{
    public ValidateOptionsResult Validate(string? name, AzureOpenAiOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        if (options.MaxCompletionTokens < 0)
        {
            return ValidateOptionsResult.Fail(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.MaxCompletionTokens)} must be zero or greater.");
        }

        int effectiveMaxCompletionTokens = options.MaxCompletionTokens <= 0
            ? AzureOpenAiOptions.DefaultMaxCompletionTokens
            : options.MaxCompletionTokens;

        if (effectiveMaxCompletionTokens <= 0)
        {
            return ValidateOptionsResult.Fail(
                $"{AzureOpenAiOptions.SectionName}:{nameof(AzureOpenAiOptions.MaxCompletionTokens)} must resolve to a value greater than zero.");
        }

        return ValidateOptionsResult.Success;
    }
}