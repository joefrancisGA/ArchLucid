using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Artifacts;

public class ArtifactBundle
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid BundleId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public Guid ManifestId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>Bundle lifecycle at rest (defaults to <see cref="ArtifactBundleStatus.Available" />).</summary>
    public ArtifactBundleStatus Status
    {
        get;
        set;
    } = ArtifactBundleStatus.Available;

    private List<SynthesizedArtifact> artifacts = [];

    public List<SynthesizedArtifact> Artifacts
    {
        get => artifacts;
        set => artifacts = ContractCollectionDefaults.Coalesce(value);
    }

    public SynthesisTrace Trace
    {
        get;
        set;
    } = new();
}

