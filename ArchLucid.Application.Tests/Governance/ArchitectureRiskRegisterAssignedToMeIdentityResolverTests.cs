using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterAssignedToMeIdentityResolverTests
{
    [Fact]
    public void Resolve_collects_mailbox_actor_and_actor_id()
    {
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.TryGetSubmitterMailbox()).Returns(" Owner@Example.com ");
        actorContext.Setup(context => context.GetActor()).Returns("reviewer@example.com");
        actorContext.Setup(context => context.GetActorId()).Returns("actor-guid-123");

        IReadOnlyList<string> identities = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actorContext.Object);

        identities.Should().BeEquivalentTo(
            ["Owner@Example.com", "reviewer@example.com", "actor-guid-123"],
            options => options.WithStrictOrdering());
    }

    [Fact]
    public void Resolve_omits_api_user_actor_label()
    {
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.TryGetSubmitterMailbox()).Returns((string?)null);
        actorContext.Setup(context => context.GetActor()).Returns("api-user");
        actorContext.Setup(context => context.GetActorId()).Returns("service-principal-id");

        IReadOnlyList<string> identities = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actorContext.Object);

        identities.Should().Equal("service-principal-id");
    }
}
