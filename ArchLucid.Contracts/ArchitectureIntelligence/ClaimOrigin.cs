namespace ArchLucid.Contracts.ArchitectureIntelligence;

public enum ClaimOrigin
{
    DirectlyExtracted = 0,
    UserAsserted = 1,
    ModelInferred = 2,
    ExternallySourced = 3,
    SystemProposed = 4,
    HumanApproved = 5,
}
