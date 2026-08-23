namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>Aggregate read model for the architecture posture overview (TB-2375).</summary>
public sealed class ArchitecturePostureReadModel
{
    public IReadOnlyList<PillarFindingAggregate> PillarAggregates
    {
        get;
        init;
    } = [];

    public IReadOnlyList<PillarPackAssignment> PackAssignments
    {
        get;
        init;
    } = [];

    public ReviewIntegrityAggregate ReviewIntegrity
    {
        get;
        init;
    } = new();

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
