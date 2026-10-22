namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>One JSONL-style supervised fine-tuning example derived from an accepted manifest.</summary>
public sealed class FineTuningTrainingRecord
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public Guid ManifestId
    {
        get;
        set;
    }

    public string SystemPrompt
    {
        get;
        set;
    } = string.Empty;

    public string UserPrompt
    {
        get;
        set;
    } = string.Empty;

    public string AssistantCompletion
    {
        get;
        set;
    } = string.Empty;

    public string ContentHash
    {
        get;
        set;
    } = string.Empty;
}
