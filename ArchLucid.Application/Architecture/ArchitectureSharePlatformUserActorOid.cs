namespace ArchLucid.Application.Architecture;

/// <summary>Maps platform-user share grants to the ActorOid column until jwt oid keys are resolved at grant time.</summary>
internal static class ArchitectureSharePlatformUserActorOid
{
    private const string Prefix = "platform-user:";

    internal static string FromUserId(Guid userId) => $"{Prefix}{userId:D}";

    internal static bool TryParseUserId(string? actorOid, out Guid userId)
    {
        userId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(actorOid) || !actorOid.StartsWith(Prefix, StringComparison.Ordinal))
            return false;

        return Guid.TryParse(actorOid.AsSpan(Prefix.Length), out userId);
    }
}
