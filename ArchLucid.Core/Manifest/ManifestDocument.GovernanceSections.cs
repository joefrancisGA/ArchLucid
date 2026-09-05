using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Core.Manifest;

public partial class ManifestDocument
{
    public List<ResolvedArchitectureDecision> Decisions
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     First-class policy section: satisfied controls, violations, and exemptions.
    ///     Policy data used to live scattered across <see cref="Assumptions" /> and <see cref="Warnings" />;
    ///     this section is the authoritative location going forward.
    /// </summary>
    public PolicySection Policy
    {
        get;
        set;
    } = new();

    /// <summary>
    ///     Authority-pipeline feasibility classification with mandatory transparency trail (ADR 0050).
    /// </summary>
    public FeasibilityVerdict? FeasibilityVerdict
    {
        get;
        set;
    }

    /// <summary>
    ///     Effective governance snapshot captured at commit time (policy pack assignments, rule-set hash, compliance keys).
    /// </summary>
    public CommittedEffectiveGovernanceSnapshotDescriptor? EffectiveGovernanceAtCommit
    {
        get;
        set;
    }

    /// <summary>
    ///     Review standards sealed at commit (policy refs, focused scope, cloud target, reviewed dimensions).
    /// </summary>
    public CommittedReviewStandardsSnapshotDescriptor? ReviewStandardsAtCommit
    {
        get;
        set;
    }

    /// <summary>Wave-6 suggestion 57: policy pack id+version rows pinned at run create, bound into h(M).</summary>
    public List<Contracts.Governance.PolicyPacks.PinnedPolicyPackRow> CreateTimePolicyPackPins
    {
        get;
        set;
    } = [];

    /// <summary>Wave-10 suggestion 92: κ content hash hex pinned at create, bound into h(M) v5.</summary>
    public string? CreateTimeArchitectureVersionContentHashSha256
    {
        get;
        set;
    }

    /// <summary>Wave-10 suggestion 95/92: κ model content hash hex pinned at create, bound into h(M) v5.</summary>
    public string? CreateTimeKnowledgeModelContentHashSha256
    {
        get;
        set;
    }

    /// <summary>Wave-6 suggestion 57: evidence package ids pinned at run create, bound into h(M).</summary>
    public List<Contracts.Governance.PolicyPacks.PinnedEvidencePackageRow> CreateTimeEvidencePackagePins
    {
        get;
        set;
    } = [];

    /// <summary>Wave-7 suggestion 69: SHA-256 hex over canonical evidence pin JSON at create time.</summary>
    public string? CreateTimeEvidencePackagePinsHashSha256
    {
        get;
        set;
    }

    /// <summary>Wave-11 suggestion 106: focused pilot mode pinned at create, bound into h(M) v6.</summary>
    public bool? CreateTimeFocusedPilotModeEnabled
    {
        get;
        set;
    }

    /// <summary>Wave-11 suggestion 106: focused pilot cloud provider pinned at create, bound into h(M) v6.</summary>
    public int? CreateTimeFocusedPilotCloudProvider
    {
        get;
        set;
    }

    /// <summary>Wave-12 suggestion 120: package origin pinned at create, bound into h(M) v7.</summary>
    public string? CreateTimePackageOrigin
    {
        get;
        set;
    }

    /// <summary>Wave-12 suggestion 120: architecture request id pinned at create, bound into h(M) v7.</summary>
    public string? CreateTimeArchitectureRequestId
    {
        get;
        set;
    }

    /// <summary>Wave-12 suggestion 120: structural execution mode pinned at create, bound into h(M) v7.</summary>
    public int? CreateTimeStructuralExecutionMode
    {
        get;
        set;
    }

    /// <summary>Wave-12 suggestion 120: pilot AOAI deployment snapshot pinned at create, bound into h(M) v7.</summary>
    public string? CreateTimePilotAoaiDeploymentSnapshot
    {
        get;
        set;
    }
}
