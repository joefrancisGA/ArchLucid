namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class AdversarialReviewResult
{
    public List<SpecialistReviewFinding> SubstantiatedFindings
    {
        get;
        set;
    } = [];

    public List<AdversarialChallenge> Challenges
    {
        get;
        set;
    } = [];

    public Dictionary<AdversarialLane, double> FalsePositiveRateByLane
    {
        get;
        set;
    } = new();
}
