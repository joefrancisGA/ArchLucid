using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Core.Manifest;

public partial class ManifestDocument
{
    /// <summary>JSON contract version for persisted authority manifests (default <c>1</c>).</summary>
    public int SchemaVersion
    {
        get;
        set;
    } = 1;

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

    public Guid ManifestId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public Guid ContextSnapshotId
    {
        get;
        set;
    }

    public Guid GraphSnapshotId
    {
        get;
        set;
    }

    public Guid FindingsSnapshotId
    {
        get;
        set;
    }

    public Guid DecisionTraceId
    {
        get;
        set;
    }

    /// <summary>Wave-5 suggestion 45: architecture version bound into manifest hash projection.</summary>
    public Guid? ArchitectureVersionId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string ManifestHash
    {
        get;
        set;
    } = null!;

    public string RuleSetId
    {
        get;
        set;
    } = null!;

    public string RuleSetVersion
    {
        get;
        set;
    } = null!;

    public string RuleSetHash
    {
        get;
        set;
    } = null!;
}
