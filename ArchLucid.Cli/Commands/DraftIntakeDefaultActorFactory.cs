using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Cli.Commands;

/// <summary>Minimum actor set for draft admission when the CLI operator does not supply one (ADR 0048).</summary>
internal static class DraftIntakeDefaultActorFactory
{
    internal static ActorSet CreatePrimaryOperatorActorSet()
    {
        return new ActorSet
        {
            Actors =
            [
                new ActorDescriptor
                {
                    Label = "Primary operator",
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.Internal,
                    Contract = InteractionContract.Sync,
                    Origin = ActorOrigin.Asserted,
                    Confidence = 100,
                },
            ],
        };
    }
}
