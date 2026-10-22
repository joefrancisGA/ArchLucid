using ArchLucid.Contracts.ArchitectureIntelligence;
///     Guards adversarial challenges from masquerading as substantiated findings.
/// </summary>
public static class AdversarialChallengeLaneGuard
{
    public static bool ShouldDropChallenge(AdversarialChallenge challenge)
    {
        ArgumentNullException.ThrowIfNull(challenge);

        if (challenge.Suppressed)
            return true;

        if (string.IsNullOrWhiteSpace(challenge.FalsificationEvidenceNeeded))
            return true;

        if (string.IsNullOrWhiteSpace(challenge.Hypothesis))
            return true;

        return false;
    }

    public static bool IsHypothesisLane(AdversarialChallenge challenge)
    {
        ArgumentNullException.ThrowIfNull(challenge);

        return challenge.Lane == AdversarialLane.AdversarialChallenge;
    }
}
