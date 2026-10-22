using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for the actor descriptor model introduced in ADR 0049 (Phase 1B).
///     Covers construction, asserted-vs-inferred labeling, ActorSet admission minimum,
///     and confidence defaults.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ActorDescriptorTests
{
    // ── ActorDescriptor construction ──────────────────────────────────────────

    [SkippableFact]
    public void ActorDescriptor_DefaultConfidence_Is100()
    {
        ActorDescriptor descriptor = new()
        {
            Kind = ActorKind.Human,
            TrustOrigin = TrustOrigin.External,
            Contract = InteractionContract.Sync,
            Origin = ActorOrigin.Asserted,
        };

        descriptor.Confidence.Should().Be(100);
    }

    [SkippableFact]
    public void ActorDescriptor_Inferred_CanCarryLowerConfidence()
    {
        ActorDescriptor descriptor = new()
        {
            Kind = ActorKind.Machine,
            TrustOrigin = TrustOrigin.Internal,
            Contract = InteractionContract.AsyncBatch,
            Origin = ActorOrigin.Inferred,
            Confidence = 60,
        };

        descriptor.Origin.Should().Be(ActorOrigin.Inferred);
        descriptor.Confidence.Should().Be(60);
    }

    [SkippableFact]
    public void ActorDescriptor_AllThreeAxesAreIndependent()
    {
        ActorDescriptor a = new()
        {
            Kind = ActorKind.Both,
            TrustOrigin = TrustOrigin.PublicAnonymous,
            Contract = InteractionContract.Streaming,
            Origin = ActorOrigin.Asserted,
        };

        a.Kind.Should().Be(ActorKind.Both);
        a.TrustOrigin.Should().Be(TrustOrigin.PublicAnonymous);
        a.Contract.Should().Be(InteractionContract.Streaming);
    }

    [SkippableFact]
    public void ActorDescriptor_OptionalLabel_CanBeNull()
    {
        ActorDescriptor descriptor = new()
        {
            Kind = ActorKind.Human,
            TrustOrigin = TrustOrigin.Internal,
            Contract = InteractionContract.Sync,
            Origin = ActorOrigin.Asserted,
        };

        descriptor.Label.Should().BeNull();
    }

    [SkippableFact]
    public void ActorDescriptor_Label_CanBeSet()
    {
        ActorDescriptor descriptor = new()
        {
            Kind = ActorKind.Human,
            TrustOrigin = TrustOrigin.External,
            Contract = InteractionContract.Sync,
            Origin = ActorOrigin.Asserted,
            Label = "External customer",
        };

        descriptor.Label.Should().Be("External customer");
    }

    // ── ActorSet admission minimum ────────────────────────────────────────────

    [SkippableFact]
    public void ActorSet_Empty_DoesNotMeetAdmissionMinimum()
    {
        ActorSet set = new();

        set.MeetsAdmissionMinimum.Should().BeFalse();
    }

    [SkippableFact]
    public void ActorSet_WithOneActor_MeetsAdmissionMinimum()
    {
        ActorSet set = new()
        {
            Actors =
            [
                new ActorDescriptor
                {
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.PublicAnonymous,
                    Contract = InteractionContract.Sync,
                    Origin = ActorOrigin.Asserted,
                },
            ],
        };

        set.MeetsAdmissionMinimum.Should().BeTrue();
    }

    // ── ActorSet asserted / inferred projections ──────────────────────────────

    [SkippableFact]
    public void ActorSet_InferredActors_ReturnsOnlyInferredDescriptors()
    {
        ActorDescriptor asserted = new()
        {
            Kind = ActorKind.Human,
            TrustOrigin = TrustOrigin.External,
            Contract = InteractionContract.Sync,
            Origin = ActorOrigin.Asserted,
        };

        ActorDescriptor inferred = new()
        {
            Kind = ActorKind.Machine,
            TrustOrigin = TrustOrigin.Internal,
            Contract = InteractionContract.Event,
            Origin = ActorOrigin.Inferred,
            Confidence = 70,
        };

        ActorSet set = new() { Actors = [asserted, inferred] };

        set.InferredActors.Should().ContainSingle()
            .Which.Should().BeSameAs(inferred);
    }

    [SkippableFact]
    public void ActorSet_AssertedActors_ReturnsOnlyAssertedDescriptors()
    {
        ActorDescriptor asserted = new()
        {
            Kind = ActorKind.Human,
            TrustOrigin = TrustOrigin.External,
            Contract = InteractionContract.Sync,
            Origin = ActorOrigin.Asserted,
        };

        ActorDescriptor inferred = new()
        {
            Kind = ActorKind.Machine,
            TrustOrigin = TrustOrigin.Internal,
            Contract = InteractionContract.Event,
            Origin = ActorOrigin.Inferred,
            Confidence = 70,
        };

        ActorSet set = new() { Actors = [asserted, inferred] };

        set.AssertedActors.Should().ContainSingle()
            .Which.Should().BeSameAs(asserted);
    }

    [SkippableFact]
    public void ActorSet_MultipleActors_AllThreeAxesCombineCorrectly()
    {
        ActorSet set = new()
        {
            Actors =
            [
                new ActorDescriptor
                {
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.PublicAnonymous,
                    Contract = InteractionContract.Sync,
                    Origin = ActorOrigin.Asserted,
                    Label = "Consumer user",
                },
                new ActorDescriptor
                {
                    Kind = ActorKind.Machine,
                    TrustOrigin = TrustOrigin.External,
                    Contract = InteractionContract.Event,
                    Origin = ActorOrigin.Inferred,
                    Confidence = 55,
                    Label = "Partner webhook",
                },
                new ActorDescriptor
                {
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.Internal,
                    Contract = InteractionContract.Sync,
                    Origin = ActorOrigin.Asserted,
                    Label = "Internal ops",
                },
            ],
        };

        set.Actors.Should().HaveCount(3);
        set.MeetsAdmissionMinimum.Should().BeTrue();
        set.InferredActors.Should().ContainSingle(a => a.Label == "Partner webhook");
        set.AssertedActors.Should().HaveCount(2);
    }
}
