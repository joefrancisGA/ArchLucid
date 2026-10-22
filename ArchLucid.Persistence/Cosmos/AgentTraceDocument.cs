using System.Text.Json.Serialization;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Cosmos document for agent execution traces (partition: <c>/runId</c>).</summary>
public sealed class AgentTraceDocument
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

    /// <summary>Serialized <see cref="ArchLucid.Contracts.Agents.AgentExecutionTrace" /> (same shape as SQL <c>TraceJson</c>).</summary>
    [JsonPropertyName("traceJson")]
    public string TraceJson
    {
        get;
        set;
    } = "{}";

    /// <summary>Optional Cosmos TTL in seconds (container default may also apply).</summary>
    [JsonPropertyName("ttl")]
    public int? Ttl
    {
        get;
        set;
    }

    // Denormalized summary scalars (wave 12 item 6) — list path projects these without loading TraceJson.

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
