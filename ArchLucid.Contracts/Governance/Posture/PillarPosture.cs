using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Posture;

public sealed class PillarPosture
{
    private string pillarKey = string.Empty;

    public string PillarKey
    {
        get => pillarKey;
        init => pillarKey = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string displayName = string.Empty;

    public string DisplayName
    {
        get => displayName;
        init => displayName = ContractCollectionDefaults.CoalesceRequired(value);
    }

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

    private ExaminationStateResolution examination = new();

    public ExaminationStateResolution Examination
    {
        get => examination;
        init => examination = value ?? new ExaminationStateResolution();
    }

    private IReadOnlyList<PillarPackAssignment> packAssignments = [];

    public IReadOnlyList<PillarPackAssignment> PackAssignments
    {
        get => packAssignments;
        init => packAssignments = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
