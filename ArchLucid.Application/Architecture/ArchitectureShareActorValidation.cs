namespace ArchLucid.Application.Architecture;

/// <summary>AS-096: V1 architecture shares are user oid keys only — not SCIM groups.</summary>
public static class ArchitectureShareActorValidation
{
    public const string GroupShareRejectedMessage =
        "Architecture shares must target a user oid. SCIM group ids are not supported in this wave.";

    public static bool TryValidateUserActorOid(string? actorOid, out string normalizedActorOid, out string? rejectionReason)
    {
        normalizedActorOid = string.Empty;
        rejectionReason = null;

        if (string.IsNullOrWhiteSpace(actorOid))
        {
            rejectionReason = "ActorOid is required.";

            return false;
        }

        normalizedActorOid = actorOid.Trim();

        if (normalizedActorOid.StartsWith("group:", StringComparison.OrdinalIgnoreCase)
            || normalizedActorOid.StartsWith("scim-group:", StringComparison.OrdinalIgnoreCase))
        {
            rejectionReason = GroupShareRejectedMessage;

            return false;
        }

        return true;
    }
}
