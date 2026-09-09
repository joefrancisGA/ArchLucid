namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Operator-facing summary for a finding the kernel refused to persist or demoted during merge (DR-02).
///     Never promoted to Decision-grade on the wire.
/// </summary>
public sealed class WithheldFindingSummary
{
    public string WithheldFindingId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string Reason
    {
        get;
        set;
    } = string.Empty;

    public string OriginEngineType
    {
        get;
        set;
    } = string.Empty;

    public string? OriginAgentType
    {
        get;
        set;
    }

    public string Title
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Agent result id for prose-only emission deep links.</summary>
    public string? TraceTargetId
    {
        get;
        set;
    }

    /// <summary>Merge-conflict finding id when the withheld row is a dropped alternate payload.</summary>
    public string? ConflictFindingId
    {
        get;
        set;
    }
}
