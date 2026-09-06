namespace ArchLucid.Contracts.Architecture;

/// <summary>Summary of the current editable draft child for an architecture desk.</summary>
public sealed class ArchitectureIdentityCurrentDraftSummary
{
    public Guid DraftId
    {
        get;
        set;
    }

    public string SystemName
    {
        get;
        set;
    } = string.Empty;

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    public bool SpawnLocked
    {
        get;
        set;
    }
}
