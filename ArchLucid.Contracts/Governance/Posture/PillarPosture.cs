using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Posture;

public sealed class PillarPosture
{
    public string PillarKey
    {
        get;
        init;
    } = null!;

    public string DisplayName
    {
        get;
        init;
    } = null!;

    public int DisplayOrder
    {
        get;
        init;
    }

    private PillarFindingAggregate findingCounts = new();

    public PillarFindingAggregate FindingCounts
    {
        get => findingCounts;
        init => findingCounts = value ?? new PillarFindingAggregate();
    }

    public ExaminationStateResolution Examination
    {
        get;
        init;
    } = null!;

    private IReadOnlyList<PillarPackAssignment> packAssignments = [];

    public IReadOnlyList<PillarPackAssignment> PackAssignments
    {
        get => packAssignments;
        init => packAssignments = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
