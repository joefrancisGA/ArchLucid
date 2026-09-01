using System.ClientModel;

using Azure.AI.OpenAI.Chat;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Azure OpenAI chat models split on output-token request fields: pre-o1 deployments accept legacy
///     <c>max_tokens</c>; GPT-5 / o-series require <c>max_completion_tokens</c>. The SDK defaults to legacy
///     serialization unless <see cref="Apply" /> enables the newer property.
/// </summary>
internal static class AzureOpenAiMaxOutputTokenParameterPolicy
{
    /// <summary>Prefer <c>max_completion_tokens</c> for GPT-5 / o-series deployments.</summary>
    internal const bool DefaultUsesMaxCompletionTokensProperty = true;

    internal static void Apply(ChatCompletionOptions options, bool useMaxCompletionTokensProperty)
    {
        ArgumentNullException.ThrowIfNull(options);

#pragma warning disable AOAI001 // Experimental API required for GPT-5/o-series max_completion_tokens serialization.
        options.SetNewMaxCompletionTokensPropertyEnabled(useMaxCompletionTokensProperty);
#pragma warning restore AOAI001
    }

    internal static bool TryGetAlternateSerialization(
        ClientResultException ex,
        bool currentlyUsesMaxCompletionTokensProperty,
        out bool alternateUsesMaxCompletionTokensProperty)
    {
        alternateUsesMaxCompletionTokensProperty = currentlyUsesMaxCompletionTokensProperty;

        if (ex.Status != 400)
            return false;

        if (currentlyUsesMaxCompletionTokensProperty && IsUnsupportedParameter(ex, "max_completion_tokens"))
        {
            alternateUsesMaxCompletionTokensProperty = false;

            return true;
        }

        if (!currentlyUsesMaxCompletionTokensProperty && IsUnsupportedParameter(ex, "max_tokens"))
        {
            alternateUsesMaxCompletionTokensProperty = true;

            return true;
        }

        return false;
    }

    private static bool IsUnsupportedParameter(ClientResultException ex, string parameterName) =>
        ex.Message.Contains($"Parameter: {parameterName}", StringComparison.OrdinalIgnoreCase);
}
