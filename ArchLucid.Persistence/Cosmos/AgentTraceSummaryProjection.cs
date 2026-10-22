using System.Text.Json.Serialization;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Cosmos projection for operator trace summaries — omits fat <c>traceJson</c> (wave 12 item 6).
/// </summary>
public sealed class AgentTraceSummaryProjection
{
    [JsonPropertyName("id")]
    public string Id
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("runId")]
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("taskId")]
    public string TaskId
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("createdUtc")]
    public string CreatedUtc
    {
        get;
        set;
    } = string.Empty;

    [JsonPropertyName("agentType")]
    public string? AgentType
    {
        get;
        set;
    }

    [JsonPropertyName("parseSucceeded")]
    public bool ParseSucceeded
    {
        get;
        set;
    }

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

    [JsonPropertyName("estimatedCostUsd")]
    public decimal? EstimatedCostUsd
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

    [JsonPropertyName("modelAlias")]
    public string? ModelAlias
    {
        get;
        set;
    }

    [JsonPropertyName("qualityWarning")]
    public bool QualityWarning
    {
        get;
        set;
    }

    [JsonPropertyName("qualityRejected")]
    public bool QualityRejected
    {
        get;
        set;
    }

    [JsonPropertyName("blobUploadFailed")]
    public bool? BlobUploadFailed
    {
        get;
        set;
    }
}
