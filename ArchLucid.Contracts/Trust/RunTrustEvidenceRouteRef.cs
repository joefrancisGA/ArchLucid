namespace ArchLucid.Contracts.Trust;

/// <summary>Stable API-relative path for deep-linking evidence routes (no host; optional proxy prefix on clients).</summary>
public sealed class RunTrustEvidenceRouteRef
{
    public string Rel
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Path beginning with <c>/v1/</c> …</summary>
    public string Path
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;
}
