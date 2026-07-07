using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftAdmissionGateTests
{
    private readonly DraftAdmissionGate _gate = new();

    [Fact]
    public void Evaluate_Redirects_WhenIntentTooShort()
    {
        DraftRequestDocument document = new() { FreeTextIntent = "short" };

        DraftAdmissionEvaluation result = _gate.Evaluate(document);

        result.Admitted.Should().BeFalse();
        result.RedirectReason.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Evaluate_Redirects_WhenNoBusinessOutcome()
    {
        DraftRequestDocument document = new() { FreeTextIntent = DraftIntakeTestIntents.ValidCompliancePlatform };

        DraftAdmissionEvaluation result = _gate.Evaluate(document);

        result.Admitted.Should().BeFalse();
        result.RedirectReason.Should().Contain("business outcome");
    }

    [Fact]
    public void Evaluate_Redirects_WhenNoActors()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = DraftIntakeTestIntents.ValidCompliancePlatform,
            BusinessOutcome = "Reduce manual audit prep time",
        };

        DraftAdmissionEvaluation result = _gate.Evaluate(document);

        result.Admitted.Should().BeFalse();
        result.RedirectReason.Should().Contain("user");
    }

    [Fact]
    public void Evaluate_Admits_WhenActorAndOutcomePresent()
    {
        DraftRequestDocument document = new()
        {
            FreeTextIntent = DraftIntakeTestIntents.ValidCompliancePlatform,
            BusinessOutcome = "Reduce manual audit prep time",
            ActorSet = new ActorSet
            {
                Actors =
                [
                    new ActorDescriptor
                    {
                        Kind = ActorKind.Human,
                        TrustOrigin = TrustOrigin.Internal,
                        Contract = InteractionContract.Sync,
                        Origin = ActorOrigin.Asserted,
                    },
                ],
            },
        };

        DraftAdmissionEvaluation result = _gate.Evaluate(document);

        result.Admitted.Should().BeTrue();
        result.RedirectReason.Should().BeNull();
    }
}
