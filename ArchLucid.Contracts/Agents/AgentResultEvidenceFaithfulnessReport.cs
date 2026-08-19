namespace ArchLucid.Contracts.Agents;

/// <summary>Deterministic heuristic report for AgentResult grounding against an <see cref="AgentEvidencePackage"/>.</summary>
public sealed record AgentResultEvidenceFaithfulnessReport(
    int ClaimsChecked,
    int ClaimsSupported,
    int FindingsChecked,
    int FindingsSupported,
    double SupportRatio,
    IReadOnlyList<string> UnsupportedIds)
{
    /// <summary>False when there was no checkable claim/finding content (TB-256).</summary>
    public bool HasCheckableContent => ClaimsChecked + FindingsChecked > 0;
}
