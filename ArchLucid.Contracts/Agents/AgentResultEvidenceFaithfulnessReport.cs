namespace ArchLucid.Contracts.Agents;

/// <summary>Deterministic heuristic report for AgentResult grounding against an <see cref="AgentEvidencePackage"/>.</summary>
public sealed record AgentResultEvidenceFaithfulnessReport(
    int ClaimsChecked,
    int ClaimsSupported,
    int FindingsChecked,
    int FindingsSupported,
    double SupportRatio,
    IReadOnlyList<string> UnsupportedIds);
