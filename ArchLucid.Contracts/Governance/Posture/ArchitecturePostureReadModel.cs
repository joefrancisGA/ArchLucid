using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>Aggregate read model for the architecture posture overview (TB-2375).</summary>
public sealed class ArchitecturePostureReadModel
{
    private IReadOnlyList<PillarFindingAggregate> pillarAggregates = [];

    public IReadOnlyList<PillarFindingAggregate> PillarAggregates
    {
        get => pillarAggregates;
        init => pillarAggregates = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<PillarPackAssignment> packAssignments = [];

    public IReadOnlyList<PillarPackAssignment> PackAssignments
    {
        get => packAssignments;
        init => packAssignments = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private ReviewIntegrityAggregate reviewIntegrity = new();

    public ReviewIntegrityAggregate ReviewIntegrity
    {
        get => reviewIntegrity;
        init => reviewIntegrity = value ?? new ReviewIntegrityAggregate();
    }

    public int UncategorizedCount
    {
        get;
        init;
    }

    public DateTimeOffset? LatestSnapshotCreatedUtc
    {
        get;
        init;
    }
}
