namespace ArchLucid.Contracts.ArchitectureIntelligence;

public enum InventoryFalsificationOutcome
{
    Untestable = 0,
    Refuted = 1,
    SurvivedWithinTestedScope = 2,
    HumanReviewRequired = 3,
}

/// <summary>A counterexample test restricted to the referenced Azure inventory observation.</summary>
public sealed record InventoryFalsificationProbe(
    InventoryFalsificationOutcome Outcome,
    string Coverage,
    PublicNetworkAccessVerification? Verification);
