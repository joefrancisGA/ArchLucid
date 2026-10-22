using System.Text.Json;

using ArchLucid.Core.Explanation;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Explanation;

/// <inheritdoc cref="IDeterministicExplanationService" />
public sealed partial class DeterministicExplanationService(ILogger<DeterministicExplanationService> logger)
    : IDeterministicExplanationService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    private T? TryDeserialize<T>(string? json) where T : class
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex,
                "Failed to deserialize LLM Explanation response as {Type}; falling back to heuristic.", typeof(T).Name);

            return null;
        }
    }
}
