using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class IncrementalReReviewResult
{
    private ReReviewScope scope = new();

    public ReReviewScope Scope
    {
        get => scope;
        set => scope = value ?? new ReReviewScope();
    }

    private List<SpecialistReviewResult> specialistResults = [];

    public List<SpecialistReviewResult> SpecialistResults
    {
        get => specialistResults;
        set => specialistResults = ContractCollectionDefaults.Coalesce(value);
    }

    private List<GlobalInvariantCheckResult> globalInvariantResults = [];

    public List<GlobalInvariantCheckResult> GlobalInvariantResults
    {
        get => globalInvariantResults;
        set => globalInvariantResults = ContractCollectionDefaults.Coalesce(value);
    }

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

    private IReadOnlyList<string> mergedFindingIds = [];

    public IReadOnlyList<string> MergedFindingIds
    {
        get => mergedFindingIds;
        set => mergedFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
