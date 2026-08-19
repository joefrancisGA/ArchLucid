namespace ArchLucid.Contracts.Runs;

/// <summary>Unified authority + coordinator decision explainability on run detail (TB-054).</summary>
public sealed class RunDecisionExplainabilityDto
{
    public RunDecisionExplainabilitySnapshotIds SnapshotIds
    {
        get;
        set;
    } = new();

    public RunAuthorityRuleAuditExplainabilitySection? AuthorityRuleAudit
    {
        get;
        set;
    }

    public IReadOnlyList<RunManifestDecisionExplainabilityRow> ManifestDecisions
    {
        get;
        set;
    } = [];

    public IReadOnlyList<RunCoordinatorDecisionNodeExplainabilityRow> CoordinatorDecisionNodes
    {
        get;
        set;
    } = [];

    public IReadOnlyList<RunFindingEngineFailureExplainabilityRow> FindingEngineFailures
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> ManifestHonestyWarnings
    {
        get;
        set;
    } = [];
}
