using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Explanation;

/// <summary>
///     Slim read DTO for deterministic explainability evidence shared by Decisioning and Application layers.
/// </summary>
public sealed record FindingExplainabilityEvidenceRecord
{
    public FindingExplainabilityEvidenceRecord(
        IReadOnlyList<string> EvidenceRefs,
        string Conclusion,
        IReadOnlyList<string> AlternativePathsConsidered,
        string RuleId)
    {
        evidenceRefsBacking = ContractCollectionDefaults.CoalesceReadOnly(EvidenceRefs);
        this.Conclusion = Conclusion;
        alternativePathsConsideredBacking = ContractCollectionDefaults.CoalesceReadOnly(AlternativePathsConsidered);
        this.RuleId = RuleId;
    }

    private IReadOnlyList<string> evidenceRefsBacking = [];

    public IReadOnlyList<string> EvidenceRefs
    {
        get => evidenceRefsBacking;
        init => evidenceRefsBacking = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string Conclusion
    {
        get;
        init;
    } = string.Empty;

    private IReadOnlyList<string> alternativePathsConsideredBacking = [];

    public IReadOnlyList<string> AlternativePathsConsidered
    {
        get => alternativePathsConsideredBacking;
        init => alternativePathsConsideredBacking = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public string RuleId
    {
        get;
        init;
    } = string.Empty;
}
