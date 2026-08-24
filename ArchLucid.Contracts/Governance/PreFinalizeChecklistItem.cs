namespace ArchLucid.Contracts.Governance;

/// <summary>One human-readable pre-finalize readiness row.</summary>
public sealed class PreFinalizeChecklistItem
{
    public string ItemId
    {
        get;
        init;
    } = null!;

    public string Title
    {
        get;
        init;
    } = null!;

    public string? Detail
    {
        get;
        init;
    }

    public PreFinalizeChecklistItemStatus Status
    {
        get;
        init;
    }

    public int Count
    {
        get;
        init;
    }
}
