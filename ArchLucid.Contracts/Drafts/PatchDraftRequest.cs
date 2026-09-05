using System.Text.Json.Serialization;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Partial update while <see cref="DraftRequestStatus.Drafting" /> (ADR 0048).</summary>
public sealed class PatchDraftRequest
{
    public string? FreeTextIntent
    {
        get;
        set;
    }

    public string? SystemName
    {
        get;
        set;
    }

    public string? BusinessOutcome
    {
        get;
        set;
    }

    public ActorSet? ActorSet
    {
        get;
        set;
    }

    [JsonPropertyName("focusedPilotModeEnabled")]
    public bool? FocusedPilotModeEnabled
    {
        get;
        set;
    }

    [JsonPropertyName("workflowIntent")]
    public string? WorkflowIntent
    {
        get;
        set;
    }

    [JsonPropertyName("structuredBrief")]
    public ArchitectureDraftStructuredBrief? StructuredBrief
    {
        get;
        set;
    }

    /// <summary>Optimistic concurrency token from the last GET (LK-12).</summary>
    [JsonPropertyName("expectedUpdatedUtc")]
    public DateTime? ExpectedUpdatedUtc
    {
        get;
        set;
    }

    /// <summary>When true, skip stale-token check and overwrite the server document (LK-12 keep mine).</summary>
    [JsonPropertyName("forceOverwrite")]
    public bool? ForceOverwrite
    {
        get;
        set;
    }
}
