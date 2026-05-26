namespace ArchLucid.Core.Configuration;

/// <summary>Post-retrieval manifest chunk summarization when estimated tokens exceed the safe budget.</summary>
public sealed class ManifestChunkSummarizationOptions
{
    public const string SectionPath = "Retrieval:ManifestChunkSummarization";

    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Estimated input-token budget for manifest corpus hits before cheap LLM summarization runs.</summary>
    public int SafeTokenLimit
    {
        get;
        set;
    } = 12_000;
}
