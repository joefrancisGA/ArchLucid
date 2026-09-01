using System.ClientModel;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Some Azure OpenAI deployments (for example reasoning-only models) reject non-default <c>temperature</c> values.
///     When the provider returns HTTP 400 for temperature, omit the parameter and retry so the model default applies.
/// </summary>
internal static class AzureOpenAiTemperatureParameterPolicy
{
    internal static bool TryOmitTemperature(ClientResultException ex) =>
        ex.Status == 400
        && ex.Message.Contains("Parameter: temperature", StringComparison.OrdinalIgnoreCase);

    internal static void Omit(ChatCompletionOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        // Provider default (often 1) applies when temperature is not sent.
        options.Temperature = null;
    }
}
