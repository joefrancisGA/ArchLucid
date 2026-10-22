namespace ArchLucid.Contracts.Integrations;

/// <summary>Operator-visible ITSM ticket linkage for a finding (TB-063).</summary>
public sealed class ItsmFindingCorrelationListItem
{
    public string Provider
    {
        get;
        set;
    } = string.Empty;

    public string ExternalKey
    {
        get;
        set;
    } = string.Empty;

    public string? ExternalSysId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>Vendor browse URL when instance/base URL is configured; otherwise null.</summary>
    public string? ExternalUrl
    {
        get;
        set;
    }
}
