namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Candidate profile validation result for internal activation gates.</summary>
public sealed class RecommendationLearningValidationCheck
{
    public string Name
    {
        get;
        set;
    } = string.Empty;

    public string Result
    {
        get;
        set;
    } = "Pass";

    public string Detail
    {
        get;
        set;
    } = string.Empty;
}
