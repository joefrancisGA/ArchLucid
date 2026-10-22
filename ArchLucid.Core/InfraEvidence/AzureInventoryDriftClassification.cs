namespace ArchLucid.Core.InfraEvidence;

/// <summary>Drift classification for a semantic inventory diff change.</summary>
public enum AzureInventoryDriftClassification
{
    Expected = 0,
    Approved = 1,
    Unapproved = 2,
    SecurityRelevant = 3,
    ArchitectureRelevant = 4,
    PotentiallyDangerous = 5,
    Unknown = 6,
}
