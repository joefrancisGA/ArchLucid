namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class SpecialistReviewResult
{
    public QualityDimension Dimension
    {
        get;
        set;
    }

    public List<SpecialistReviewFinding> Findings
    {
        get;
        set;
    } = [];

    public List<string> OpenQuestions
    {
        get;
        set;
    } = [];
}
