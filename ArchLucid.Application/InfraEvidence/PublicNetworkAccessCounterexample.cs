using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.InfraEvidence;

internal static class PublicNetworkAccessCounterexample
{
    internal const string Coverage = "The explicit Azure property only, for the cited resource and snapshot.";

    internal static InventoryFalsificationProbe Evaluate(
        PublicNetworkAccessVerification? verification, bool hasResourceBinding)
    {
        InventoryFalsificationOutcome outcome = verification is
            { SnapshotId: not null, CapturedUtc: not null, Evidence: not null }
            ? verification.Outcome switch
            {
                PublicNetworkAccessVerificationOutcome.Contradicted => InventoryFalsificationOutcome.Refuted,
                PublicNetworkAccessVerificationOutcome.Verified => InventoryFalsificationOutcome.SurvivedWithinTestedScope,
                _ => InventoryFalsificationOutcome.Untestable,
            }
            : hasResourceBinding ? InventoryFalsificationOutcome.Untestable : InventoryFalsificationOutcome.HumanReviewRequired;
        return new(outcome, Coverage, verification);
    }
}
