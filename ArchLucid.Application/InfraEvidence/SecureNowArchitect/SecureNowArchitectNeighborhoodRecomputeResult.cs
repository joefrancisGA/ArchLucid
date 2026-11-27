namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectNeighborhoodRecomputeResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public int ChangeCount
    {
        get;
        init;
    }

    public int SeedCount
    {
        get;
        init;
    }

    public int PathsCarriedForward
    {
        get;
        init;
    }

    public int PathsDiscovered
    {
        get;
        init;
    }

    public int PathsPersisted
    {
        get;
        init;
    }
}
