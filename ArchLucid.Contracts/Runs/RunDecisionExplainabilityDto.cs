using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Runs;

/// <summary>Unified authority + coordinator decision explainability on run detail (TB-054).</summary>
public sealed class RunDecisionExplainabilityDto
{
    private RunDecisionExplainabilitySnapshotIds snapshotIds = new();

    public RunDecisionExplainabilitySnapshotIds SnapshotIds
    {
        get => snapshotIds;
        set => snapshotIds = value ?? new RunDecisionExplainabilitySnapshotIds();
    }

    public RunAuthorityRuleAuditExplainabilitySection? AuthorityRuleAudit
    {
        get;
        set;
    }

    private IReadOnlyList<RunManifestDecisionExplainabilityRow> manifestDecisions = [];

    public IReadOnlyList<RunManifestDecisionExplainabilityRow> ManifestDecisions
    {
        get => manifestDecisions;
        set => manifestDecisions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RunCoordinatorDecisionNodeExplainabilityRow> coordinatorDecisionNodes = [];

    public IReadOnlyList<RunCoordinatorDecisionNodeExplainabilityRow> CoordinatorDecisionNodes
    {
        get => coordinatorDecisionNodes;
        set => coordinatorDecisionNodes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RunFindingEngineFailureExplainabilityRow> findingEngineFailures = [];

    public IReadOnlyList<RunFindingEngineFailureExplainabilityRow> FindingEngineFailures
    {
        get => findingEngineFailures;
        set => findingEngineFailures = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> manifestHonestyWarnings = [];

    public IReadOnlyList<string> ManifestHonestyWarnings
    {
        get => manifestHonestyWarnings;
        set => manifestHonestyWarnings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
