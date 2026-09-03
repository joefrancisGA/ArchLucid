using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Core.Manifest;

public class ManifestDocument
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

    public ManifestMetadata Metadata
    {
        get;
        set;
    } = new();

    public RequirementsCoverageSection Requirements
    {
        get;
        set;
    } = new();

    public TopologySection Topology
    {
        get;
        set;
    } = new();

    public SecuritySection Security
    {
        get;
        set;
    } = new();

    public ComplianceSection Compliance
    {
        get;
        set;
    } = new();

    public CostSection Cost
    {
        get;
        set;
    } = new();

    public ConstraintSection Constraints
    {
        get;
        set;
    } = new();

    public UnresolvedIssuesSection UnresolvedIssues
    {
        get;
        set;
    } = new();

    public List<ResolvedArchitectureDecision> Decisions
    {
        get;
        set;
    } = [];

    public List<string> Assumptions
    {
        get;
        set;
    } = [];

    public List<string> Warnings
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

    public ManifestProvenance Provenance
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
