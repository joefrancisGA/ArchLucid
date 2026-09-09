namespace ArchLucid.Contracts.Architecture;

/// <summary>Attach an existing Azure inventory snapshot to an architecture identity (AS-048).</summary>
public sealed class AttachArchitectureInventoryBindingRequest
{
    public Guid SnapshotId
    {
        get;
        set;
    }
}
