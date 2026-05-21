using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

public sealed class ArchitectureRequestDraftService(
    IAgentCompletionClient completionClient) : IArchitectureRequestDraftService
{
    private const string DraftSystemPrompt =
        "You are an enterprise architecture intake assistant. " +
        "Given this system description, produce a JSON object with keys: " +
        "suggestedConstraints (string[]), suggestedCapabilities (string[]), suggestedAssumptions (string[]), " +
        "topologyHints (string[]), securityBaselineHints (string[]). " +
        "Be specific and concise. Return ONLY valid JSON.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);


        if (string.IsNullOrWhiteSpace(input.FreeTextDescription))
            throw new ArgumentException("FreeTextDescription is required.", nameof(input));

        string responseJson = await _completionClient.CompleteJsonAsync(
            DraftSystemPrompt,
            input.FreeTextDescription.Trim(),
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        DraftArchitectureRequestResponseShape? response =
            JsonSerializer.Deserialize<DraftArchitectureRequestResponseShape>(responseJson, JsonOptions);

        if (response is null)
            throw new InvalidOperationException("Draft response was empty.");

        return new DraftArchitectureRequestResponse
        {
            SuggestedConstraints = Normalize(response.SuggestedConstraints),
            SuggestedCapabilities = Normalize(response.SuggestedCapabilities),
            SuggestedAssumptions = Normalize(response.SuggestedAssumptions),
            TopologyHints = Normalize(response.TopologyHints),
            SecurityBaselineHints = Normalize(response.SecurityBaselineHints)
        };
    }

    private static string[] Normalize(string[]? values)
    {

        if (values is null || values.Length == 0)
            return [];

        return values
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private sealed class DraftArchitectureRequestResponseShape
    {
        [JsonPropertyName("suggestedConstraints")]
        public string[]? SuggestedConstraints
        {
            get;
            init;
        }

        [JsonPropertyName("suggestedCapabilities")]
        public string[]? SuggestedCapabilities
        {
            get;
            init;
        }

        [JsonPropertyName("suggestedAssumptions")]
        public string[]? SuggestedAssumptions
        {
            get;
            init;
        }

        [JsonPropertyName("topologyHints")]
        public string[]? TopologyHints
        {
            get;
            init;
        }

        [JsonPropertyName("securityBaselineHints")]
        public string[]? SecurityBaselineHints
        {
            get;
            init;
        }
    }
}
