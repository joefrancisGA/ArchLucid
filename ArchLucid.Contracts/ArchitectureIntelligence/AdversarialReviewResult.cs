using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class AdversarialReviewResult
{
    private List<SpecialistReviewFinding> substantiatedFindings = [];

    public List<SpecialistReviewFinding> SubstantiatedFindings
    {
        get => substantiatedFindings;
        set => substantiatedFindings = ContractCollectionDefaults.Coalesce(value);
    }

    private List<AdversarialChallenge> challenges = [];

    public List<AdversarialChallenge> Challenges
    {
        get => challenges;
        set => challenges = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<AdversarialLane, double> falsePositiveRateByLane = new();

    public Dictionary<AdversarialLane, double> FalsePositiveRateByLane
    {
        get => falsePositiveRateByLane;
        set => falsePositiveRateByLane = ContractCollectionDefaults.CoalesceDictionary(value);
    }
}
