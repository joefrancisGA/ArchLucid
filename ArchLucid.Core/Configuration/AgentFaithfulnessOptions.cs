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

    /// <summary>Minimum distinct content tokens that must overlap evidence (TB-255).</summary>
    public int MinDistinctOverlapTokens
    {
        get;
        set;
    } = 2;

    /// <summary>Minimum fraction of distinct content tokens that must match evidence (TB-255).</summary>
    public double MinOverlapDensityRatio
    {
        get;
        set;
    } = 0.30;

    /// <summary>
    ///     When a claim cites explicit evidence refs, require at least this overlap density on the cited blob only (TB-324).
    /// </summary>
    public double MinCitationFidelityDensityRatio
    {
        get;
        set;
    } = 0.45;

    /// <summary>
    ///     Max allowed gap between package-wide overlap and cited-chunk overlap before flagging a hallucinated citation (TB-324).
    /// </summary>
    public double MaxCitationVsPackageOverlapGap
    {
        get;
        set;
    } = 0.20;
}
