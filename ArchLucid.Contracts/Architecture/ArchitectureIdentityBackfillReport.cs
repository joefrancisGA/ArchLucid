namespace ArchLucid.Contracts.Architecture;

/// <summary>Idempotent counts from a conservative architecture-identity backfill pass (DA-12).</summary>
public sealed class ArchitectureIdentityBackfillReport
{
    public int SpawnedDraftsLinked
    {
        get;
        set;
    }

    public int CreatedRunsLinked
    {
        get;
        set;
    }

    public int ReviewRunsLinked
    {
        get;
        set;
    }

    public int OrphanDraftsLinked
    {
        get;
        set;
    }

    public int DisplayNamesRefreshed
    {
        get;
        set;
    }

    public int TotalMutations =>
        SpawnedDraftsLinked + CreatedRunsLinked + ReviewRunsLinked + OrphanDraftsLinked + DisplayNamesRefreshed;
}
