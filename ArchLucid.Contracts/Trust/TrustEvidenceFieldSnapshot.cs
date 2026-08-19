namespace ArchLucid.Contracts.Trust;

/// <summary>One labeled row on the run trust-evidence card.</summary>
public sealed class TrustEvidenceFieldSnapshot
{
    public string Title
    {
        get;
        set;
    } = string.Empty;

    /// <summary>One of <see cref="TrustEvidenceStatusValue"/> constants.</summary>
    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string? Detail
    {
        get;
        set;
    }
}
