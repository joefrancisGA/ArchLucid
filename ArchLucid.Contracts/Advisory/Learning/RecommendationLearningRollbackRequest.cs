namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Operator-initiated rollback to a prior persisted profile version.</summary>
public sealed class RecommendationLearningRollbackRequest
{
    public Guid ProfileId
    {
        get;
        set;
    }

    public string Reason
    {
        get;
        set;
    } = string.Empty;
}
