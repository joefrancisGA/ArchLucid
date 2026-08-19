namespace ArchLucid.Contracts.Trust;

/// <summary>Sponsor-safe summary for the highest-severity finding’s deterministic evidence pointers.</summary>
public sealed class RunTrustEvidenceTopFindingRow
{
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public string? Title
    {
        get;
        set;
    }

    public string TraceCompletenessLabel
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Counts and manifest version only (no prompts, model text, or secrets).</summary>
    public string EvidencePointersSummary
    {
        get;
        set;
    } = string.Empty;
}
