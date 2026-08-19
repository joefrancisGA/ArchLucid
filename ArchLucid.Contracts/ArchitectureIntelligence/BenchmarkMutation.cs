namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class BenchmarkMutation
{
    public string MutationId
    {
        get;
        set;
    } = null!;

    public string Description
    {
        get;
        set;
    } = null!;

    /// <summary>Human-readable description of the delta applied to the benchmark fixture.</summary>
    public string ApplyDelta
    {
        get;
        set;
    } = null!;
}
