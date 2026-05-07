using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FirstValueEvidenceCompletenessClassifierTests
{
    [Fact]
    public void Classify_demo_only_is_incomplete_even_if_sendability_were_inconsistent()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.DemoOnly,
            ProofPackageSendability.NotSendable,
            ["demo"],
            [],
            []);

        FirstValueEvidenceCompletenessClassifier.Classify(gate).Should().Be(FirstValueEvidenceCompletenessLevel.Incomplete);
    }

    [Fact]
    public void Classify_not_sendable_is_incomplete()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.DemoOnly,
            ProofPackageSendability.NotSendable,
            [],
            ["hard"],
            []);

        FirstValueEvidenceCompletenessClassifier.Classify(gate).Should().Be(FirstValueEvidenceCompletenessLevel.Incomplete);
    }

    [Fact]
    public void Classify_partial_tier_is_partial()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Partial,
            ProofPackageSendability.SendableWithCaveats,
            [],
            [],
            ["soft"]);

        FirstValueEvidenceCompletenessClassifier.Classify(gate).Should().Be(FirstValueEvidenceCompletenessLevel.Partial);
    }

    [Fact]
    public void Classify_complete_sendable_is_strong()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            [],
            [],
            []);

        FirstValueEvidenceCompletenessClassifier.Classify(gate).Should().Be(FirstValueEvidenceCompletenessLevel.Strong);
    }
}
