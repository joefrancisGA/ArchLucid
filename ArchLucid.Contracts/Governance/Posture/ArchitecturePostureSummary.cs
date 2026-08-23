namespace ArchLucid.Contracts.Governance.Posture;

public sealed class ArchitecturePostureSummary
{
    public IReadOnlyList<PillarPosture> Pillars
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

    public string? PrimaryPillarKey
    {
        get;
        init;
    }

    public DateTimeOffset? LatestSnapshotCreatedUtc
    {
        get;
        init;
    }

    public bool IsDegraded
    {
        get;
        init;
    }
}
