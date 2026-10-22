using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class SpecialistReviewResult
{
    public QualityDimension Dimension
    {
        get;
        set;
    }

    private List<SpecialistReviewFinding> findings = [];

    public List<SpecialistReviewFinding> Findings
    {
        get => findings;
        set => findings = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> openQuestions = [];

    public List<string> OpenQuestions
    {
        get => openQuestions;
        set => openQuestions = ContractCollectionDefaults.Coalesce(value);
    }
}
