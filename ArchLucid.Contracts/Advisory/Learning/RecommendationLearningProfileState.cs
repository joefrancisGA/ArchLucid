namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Operational lifecycle state for the persisted recommendation-learning profile in a scope.</summary>
public enum RecommendationLearningProfileState
{
    NotBuilt = 0,
    InsufficientData = 1,
    Active = 2,
}
