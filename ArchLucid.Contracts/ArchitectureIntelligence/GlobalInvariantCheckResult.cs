namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class GlobalInvariantCheckResult
{
    public string InvariantId
    {
        get;
        set;
    } = null!;

    public bool Passed
    {
        get;
        set;
    }

    public string? Detail
    {
        get;
        set;
    }
}
