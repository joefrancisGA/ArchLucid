namespace ArchLucid.Contracts.Architecture;

/// <summary>One row in a read-only seal-vs-draft delta projection (PC-06).</summary>
public sealed class ArchitectureSealDeltaItem
{
    public string Section
    {
        get;
        set;
    } = string.Empty;

    public string Key
    {
        get;
        set;
    } = string.Empty;

    public string DiffKind
    {
        get;
        set;
    } = string.Empty;

    public string? BeforeValue
    {
        get;
        set;
    }

    public string? AfterValue
    {
        get;
        set;
    }

    public string? Notes
    {
        get;
        set;
    }
}
