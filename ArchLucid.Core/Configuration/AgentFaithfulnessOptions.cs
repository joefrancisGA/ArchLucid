namespace ArchLucid.Core.Configuration;

/// <summary>Optional embedding-based AgentResult→evidence grounding (staging telemetry; not a quality-gate substitute).</summary>
public sealed class AgentFaithfulnessOptions
{
    public const string SectionPath = "ArchLucid:Agents:Faithfulness";

    /// <summary>When true, compute embedding cosine alignment vs flattened evidence (requires host-registered embedding service).</summary>
    public bool EmbeddingEnabled
    {
        get;
        set;
    }

    public int EmbeddingMaxChunkUtf16Length
    {
        get;
        set;
    } = 512;

    public int EmbeddingChunkOverlapUtf16
    {
        get;
        set;
    } = 64;
}
