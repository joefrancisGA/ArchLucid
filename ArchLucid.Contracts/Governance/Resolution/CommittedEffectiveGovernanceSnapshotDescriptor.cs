using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>
///     Compact effective-governance metadata persisted with a committed golden manifest so operators can
///     distinguish policy at commit time from current effective assignments.
/// </summary>
public sealed class CommittedEffectiveGovernanceSnapshotDescriptor
{
    public DateTime GeneratedUtc
    {
        get;
        set;
    }

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

    /// <summary>True when at least one pack assignment or compliance rule key was present at commit.</summary>
    public bool HasEffectivePolicy
    {
        get;
        set;
    }
}
