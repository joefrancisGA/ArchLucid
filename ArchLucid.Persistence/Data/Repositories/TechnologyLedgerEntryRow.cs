namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper row-shape for <c>dbo.TechnologyLedgerEntries</c>. SQL enum columns are stored as strings; mapped to
///     typed enums by <see cref="TechnologyLedgerRepository" /> after the query returns.
/// </summary>
internal sealed class TechnologyLedgerEntryRow
{
    public string EntryId
    {
        get;
        set;
    } = string.Empty;

    public Guid RunId
    {
        get;
        set;
    }

    public string Role
    {
        get;
        set;
    } = string.Empty;

    public string TechnologyName
    {
        get;
        set;
    } = string.Empty;

    public string ProviderFamily
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string Source
    {
        get;
        set;
    } = string.Empty;

    public string? EvidenceRef
    {
        get;
        set;
    }

    public string? Rationale
    {
        get;
        set;
    }

    public bool IsLocked
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
