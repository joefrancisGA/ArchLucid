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
}
