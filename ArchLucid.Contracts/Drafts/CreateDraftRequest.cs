using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for <c>POST /v1/architecture/draft</c>.</summary>
public sealed class CreateDraftRequest
{
    /// <summary>Initial free-text intent (minimum <see cref="DraftIntakeValidation.MinimumFreeTextIntentLength" /> characters after trim).</summary>
    public string FreeTextIntent
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Optional <see cref="Common.ArchitectureWorkflowIntent" /> from homepage CTA query param.</summary>
    public string? WorkflowIntent
    {
        get;
        set;
    }

    /// <summary>Prior committed run id for second-review semantic inheritance (TB-2350).</summary>
    [JsonPropertyName("priorRunId")]
    public string? PriorRunId
    {
        get;
        set;
    }
}
