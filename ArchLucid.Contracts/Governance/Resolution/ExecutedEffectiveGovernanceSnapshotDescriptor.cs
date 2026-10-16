using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>
///     Effective governance metadata captured when a review run executes, before golden commit.
/// </summary>
public sealed class ExecutedEffectiveGovernanceSnapshotDescriptor
{
    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    public bool FocusedPilotModeEnabled
    {
        get;
        set;
    }

    public string CloudProvider
    {
        get;
        set;
    } = null!;

    public int ComplianceRuleKeyCount
    {
        get;
        set;
    }

    private List<string> complianceRuleKeys = [];

    public List<string> ComplianceRuleKeys
    {
        get => complianceRuleKeys;
        set => complianceRuleKeys = ContractCollectionDefaults.Coalesce(value);
    }

    public int ConflictCount
    {
        get;
        set;
    }

    private List<CommittedGovernancePackAssignmentSnapshot> packAssignments = [];

    public List<CommittedGovernancePackAssignmentSnapshot> PackAssignments
    {
        get => packAssignments;
        set => packAssignments = ContractCollectionDefaults.Coalesce(value);
    }

    private List<CommittedCoverageAssignmentSnapshot> coverageAssignments = [];

    public List<CommittedCoverageAssignmentSnapshot> CoverageAssignments
    {
        get => coverageAssignments;
        set => coverageAssignments = ContractCollectionDefaults.Coalesce(value);
    }

    private List<NotAssessedQualityDimensionSnapshot> notAssessedQualityDimensions = [];

    public List<NotAssessedQualityDimensionSnapshot> NotAssessedQualityDimensions
    {
        get => notAssessedQualityDimensions;
        set => notAssessedQualityDimensions = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>True when at least one pack assignment or compliance rule key was present at execute.</summary>
    public bool HasEffectivePolicy
    {
        get;
        set;
    }

    /// <summary>SHA-256 hex fingerprint of the <see cref="ArchLucid.Contracts.Requests.ArchitectureRequest" /> at execute.</summary>
    public string? RequestFingerprintHex
    {
        get;
        set;
    }

    /// <summary>SHA-256 hex hash of execute-time pack assignment ids and versions.</summary>
    public string? GovernanceAssignmentsHashHex
    {
        get;
        set;
    }
}
