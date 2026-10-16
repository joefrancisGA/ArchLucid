using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Posture;

public sealed class ArchitecturePostureSummary
{
    private IReadOnlyList<PillarPosture> pillars = [];

    public IReadOnlyList<PillarPosture> Pillars
    {
        get => pillars;
        init => pillars = ContractCollectionDefaults.CoalesceReadOnly(value);
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
