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

    [JsonPropertyName("openQuestions")]
    public string? OpenQuestions
    {
        get;
        set;
    }

    /// <summary>
    ///     Optimistic concurrency token from the last GET (ADR 0088). Required unless
    ///     <see cref="ForceOverwrite"/> is true. Omit is HTTP 409 <c>draft_cas_token_missing</c>, not last-write-wins.
    /// </summary>
    [JsonPropertyName("expectedUpdatedUtc")]
    public DateTime? ExpectedUpdatedUtc
    {
        get;
        set;
    }

    /// <summary>
    ///     When true, skip CAS and overwrite the server document (Keep mine). Never defaults to true.
    ///     Writes a Required audit event (LW-015). JSON Schema cannot express required-unless-forceOverwrite.
    /// </summary>
    [JsonPropertyName("forceOverwrite")]
    public bool? ForceOverwrite
    {
        get;
        set;
    }
}
