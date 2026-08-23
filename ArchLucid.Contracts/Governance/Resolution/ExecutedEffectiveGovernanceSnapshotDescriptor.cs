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

    public List<NotAssessedQualityDimensionSnapshot> NotAssessedQualityDimensions
    {
        get;
        set;
    } = [];

    /// <summary>True when at least one pack assignment or compliance rule key was present at execute.</summary>
    public bool HasEffectivePolicy
    {
        get;
        set;
    }
}
