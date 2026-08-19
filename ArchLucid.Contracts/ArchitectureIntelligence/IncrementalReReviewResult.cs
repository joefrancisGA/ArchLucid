namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class IncrementalReReviewResult
{
    public ReReviewScope Scope
    {
        get;
        set;
    } = new();

    public List<SpecialistReviewResult> SpecialistResults
    {
        get;
        set;
    } = [];

    public List<GlobalInvariantCheckResult> GlobalInvariantResults
    {
        get;
        set;
    } = [];

    public bool FullReReviewTriggered
    {
        get;
        set;
    }

    /// <summary>
    /// Set when only the affected subgraph was re-reviewed (TB-1989).
    /// </summary>
    public string? PartialScopeDisclaimer
    {
        get;
        set;
    }
}
