using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Versioned governance bundle metadata (name, type, lifecycle) scoped to tenant/workspace/project.</summary>
public class PolicyPack
{
    public Guid PolicyPackId
    {
        get;
        set;
    } = Guid.NewGuid();

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

    private string name = string.Empty;

    public string Name
    {
        get => name;
        set => name = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>
    ///     Stable bundled-pack identity (filename stem). Null for custom packs; matching prefers slug over display name.
    /// </summary>
    public string? PackSlug
    {
        get;
        set;
    }

    private string description = string.Empty;

    public string Description
    {
        get => description;
        set => description = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public string PackType
    {
        get;
        set;
    } = PolicyPackType.BuiltIn;

    /// <summary>
    ///     Who may see or install this pack (<see cref="PolicyPackDistributionScope" />).
    ///     Orthogonal to <see cref="PackType" /> (authorship origin).
    /// </summary>
    public string DistributionScope
    {
        get;
        set;
    } = PolicyPackDistributionScope.Platform;

    public string Status
    {
        get => status;
        set => status = ContractCollectionDefaults.CoalesceStringDefault(value, PolicyPackStatus.Draft);
    }

    private string status = PolicyPackStatus.Draft;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? ActivatedUtc
    {
        get;
        set;
    }

    private string currentVersion = "1.0.0";

    public string CurrentVersion
    {
        get => currentVersion;
        set => currentVersion = ContractCollectionDefaults.CoalesceStringDefault(value, "1.0.0");
    }

    public bool IsDeleted
    {
        get;
        set;
    }

    /// <summary>
    ///     When set, identifies the single canonical provider-neutral baseline dimension this pack implements.
    ///     Null for platform overlays, compliance frameworks, and optional packs.
    /// </summary>
    public QualityDimension? QualityDimension
    {
        get;
        set;
    }
}
