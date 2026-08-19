using ArchLucid.Application.Common;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Resolves the caller identities that may appear in <c>FindingRecords.AssignedToUserId</c> (TB-2195).
///     Assignment UI accepts email-shaped owners; API keys may only match <see cref="IActorContext.GetActorId" />.
/// </summary>
public static class ArchitectureRiskRegisterAssignedToMeIdentityResolver
{
    public static IReadOnlyList<string> Resolve(IActorContext actorContext)
    {
        ArgumentNullException.ThrowIfNull(actorContext);

        HashSet<string> identities = new(StringComparer.OrdinalIgnoreCase);

        string? mailbox = actorContext.TryGetSubmitterMailbox();

        if (!string.IsNullOrWhiteSpace(mailbox))
            identities.Add(mailbox.Trim());

        string actor = actorContext.GetActor().Trim();

        if (actor.Length > 0 && !string.Equals(actor, "api-user", StringComparison.OrdinalIgnoreCase))
            identities.Add(actor);

        string actorId = actorContext.GetActorId().Trim();

        if (actorId.Length > 0)
            identities.Add(actorId);

        return identities.ToList();
    }
}
