using ArchLucid.Contracts.Governance;

using FsCheck;

namespace ArchLucid.Decisioning.Tests.Governance;

/// <summary>FsCheck arbitraries for invalid promotion pairs.</summary>
public static class InvalidGovernancePromotionArb
{
    public static Arbitrary<InvalidPromotionPair> InvalidPairs()
    {
        string[] envs = [GovernanceEnvironment.Dev, GovernanceEnvironment.Test, GovernanceEnvironment.Prod];

        return Gen.Two(Gen.Elements(envs))
            .Where(pair => !GovernanceEnvironmentOrder.IsValidPromotion(pair.Item1, pair.Item2))
            .Select(pair => new InvalidPromotionPair(pair.Item1, pair.Item2))
            .ToArbitrary();
    }
}
