namespace ArchLucid.Core.Configuration;

/// <summary>Opt-in LLM evidence summarization before context-length hard truncation.</summary>
public sealed class EvidenceSummarizationOptions
{
    public const string SectionPath = "AgentExecution:EvidenceSummarization";

    /// <summary>When false, context-length guard skips LLM evidence summarization.</summary>
    public bool Enabled
    {
        get;
        set;
    } = false;

    /// <summary>Maximum evidence characters sent to the fast-tier summarization model.</summary>
    public int MaxInputCharacters
    {
        get;
        set;
    } = 128_000;
}
