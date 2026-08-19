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

    public List<string> ComplianceRuleKeys
    {
        get;
        set;
    } = [];

    public int ConflictCount
    {
        get;
        set;
    }

    public List<CommittedGovernancePackAssignmentSnapshot> PackAssignments
    {
        get;
        set;
    } = [];

    public List<CommittedCoverageAssignmentSnapshot> CoverageAssignments
    {
        get;
        set;
    } = [];

    /// <summary>True when at least one pack assignment or compliance rule key was present at commit.</summary>
    public bool HasEffectivePolicy
    {
        get;
        set;
    }
}
