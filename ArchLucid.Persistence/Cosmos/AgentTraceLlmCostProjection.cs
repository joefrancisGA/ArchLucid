using System.Text.Json.Serialization;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Cosmos projection for LLM cost slices — token scalars only (wave 15 item 1).
/// </summary>
public sealed class AgentTraceLlmCostProjection
{
    [JsonPropertyName("inputTokenCount")]
    public int? InputTokenCount
    {
        get;
        set;
    }

    [JsonPropertyName("outputTokenCount")]
    public int? OutputTokenCount
    {
        get;
        set;
    }

    [JsonPropertyName("modelDeploymentName")]
    public string? ModelDeploymentName
    {
        get;
        set;
    }
}
