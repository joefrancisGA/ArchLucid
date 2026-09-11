using ArchLucid.Application.Common;

namespace ArchLucid.Application.Drafts;

internal static class ArchitectureWorkLeaseJwtActor
{
    public static bool TryParseSubject(string actorId, out string subjectOid, out Guid? tenantId)
    {
        subjectOid = string.Empty;
        tenantId = null;

        if (string.IsNullOrWhiteSpace(actorId)
            || !actorId.StartsWith(ActorContextKeys.JwtActorKeyPrefix, StringComparison.Ordinal))
        {
            return false;
        }

        string remainder = actorId[ActorContextKeys.JwtActorKeyPrefix.Length..];
        int separatorIndex = remainder.IndexOf(':', StringComparison.Ordinal);

        if (separatorIndex < 0)
        {
            subjectOid = remainder.Trim();

            return subjectOid.Length > 0;
        }

        string tenantPart = remainder[..separatorIndex].Trim();
        subjectOid = remainder[(separatorIndex + 1)..].Trim();

        if (subjectOid.Length == 0)
        {
            return false;
        }

        if (Guid.TryParse(tenantPart, out Guid parsedTenantId))
        {
            tenantId = parsedTenantId;
        }

        return true;
    }
}
