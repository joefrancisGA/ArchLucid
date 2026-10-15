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

    public PillarFindingAggregate FindingCounts
    {
        get;
        init;
    } = new();

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
