using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Reflection;

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

    private static readonly PropertyInfo? SerializedAdditionalRawDataProperty =
        typeof(ChatCompletionOptions).GetProperty(
            "SerializedAdditionalRawData",
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

    /// <summary>
    ///     SDK workaround: <c>new ChatCompletionOptions()</c> leaves internal <c>additionalProperties</c> null, so
    ///     <see cref="Apply" /> throws until the instance is deserialized once (Azure SDK #48287).
    /// </summary>
    internal static ChatCompletionOptions CreateOptions() =>
        ModelReaderWriter.Read<ChatCompletionOptions>(BinaryData.FromString("{}")!)!;

    internal static void Apply(ChatCompletionOptions options, bool useMaxCompletionTokensProperty)
    {
        ArgumentNullException.ThrowIfNull(options);

        EnsurePatchStateInitialized(options);

#pragma warning disable AOAI001 // Experimental API required for GPT-5/o-series max_completion_tokens serialization.
        options.SetNewMaxCompletionTokensPropertyEnabled(useMaxCompletionTokensProperty);
#pragma warning restore AOAI001
    }

    /// <summary>
    ///     Azure.AI.OpenAI 2.1.0 requires <c>SerializedAdditionalRawData</c> to be initialized before
    ///     <c>SetNewMaxCompletionTokensPropertyEnabled</c> on freshly constructed <see cref="ChatCompletionOptions" />
    ///     (azure-sdk-for-net#48287).
    /// </summary>
    private static void EnsurePatchStateInitialized(ChatCompletionOptions options)
    {
        if (SerializedAdditionalRawDataProperty is null)
        {
            return;
        }

        if (SerializedAdditionalRawDataProperty.GetValue(options) is not null)
        {
            return;
        }

        SerializedAdditionalRawDataProperty.SetValue(options, new Dictionary<string, BinaryData>());
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
