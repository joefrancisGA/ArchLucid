namespace ArchLucid.Contracts.ArchitectureIntelligence;

public enum ReReviewTrigger
{
    SystemBoundaryChange = 0,
    MajorTopologyChange = 1,
    NewTrustBoundary = 2,
    NewDataClassification = 3,
    NewJurisdiction = 4,
    CriticalQualityAttributeChange = 5,
    ModelOrPolicyPackUpgrade = 6,
    EvidenceGraphSchemaChange = 7,
    PeriodicMilestone = 8,
}
