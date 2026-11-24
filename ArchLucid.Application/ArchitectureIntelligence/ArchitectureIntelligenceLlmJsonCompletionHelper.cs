using System.Text.Json;
using System.Text.Json.Serialization;
using ArchLucid.Core;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ArchitectureIntelligenceLlmJsonCompletionHelper
{
    internal const string JsonOnlyInstruction =
        "Return ONLY valid JSON. No markdown fences or commentary. " +
        "Label each claim as evidence-backed (directly supported by supplied text) or inferred. " +
        "Never invent regulations or compliance obligations. " +
        "Label cloud-specific assumptions explicitly when present.";

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static async Task<string?> TryCompleteJsonAsync(
        IAgentCompletionClient? completionClient,
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken,
        int? maxTokens = null,
        bool propagateQuotaDenial = false)
    {
        if (completionClient is null)
        {
            return null;
        }

        try
        {
            string response = await completionClient.CompleteJsonAsync(
                systemPrompt,
                userPrompt,
                maxTokens: maxTokens,
                temperature: null,
                cancellationToken: cancellationToken);

            return string.IsNullOrWhiteSpace(response) ? null : response;
        }
        catch (JsonException)
        {
            return null;
        }
        catch (InvalidOperationException ex) when (!propagateQuotaDenial || ex is not LlmTokenQuotaExceededException)
        {
            return null;
        }
    }

    internal static T? TryDeserialize<T>(string responseJson)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(responseJson, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }
}
