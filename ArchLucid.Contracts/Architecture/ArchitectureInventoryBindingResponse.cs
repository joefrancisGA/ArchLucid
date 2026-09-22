namespace ArchLucid.Contracts.Architecture;

/// <summary>Current inventory snapshot binding for an architecture identity (AS-048).</summary>
public sealed class ArchitectureInventoryBindingResponse
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public bool IsBound
    {
        get;
        set;
    }

    public Guid? SnapshotId
    {
        get;
        set;
    }

    public string? BoundBy
    {
        get;
        set;
    }

    public DateTime? BoundUtc
    {
        get;
        set;
    }

    public DateTime? SnapshotCapturedUtc
    {
        get;
        set;
    }

    public string? SnapshotSubscriptionName
    {
        get;
        set;
    }
}
