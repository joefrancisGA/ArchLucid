using ArchLucid.Application.Architecture;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Maps the acting principal to <c>dbo.PlatformUsers.Id</c> for work-lease rows.</summary>
public sealed class ArchitectureWorkLeaseHolderResolver(
    IPlatformIdentityService platformIdentityService) : IArchitectureWorkLeaseHolderResolver
{
    private readonly IPlatformIdentityService _platformIdentityService =
        platformIdentityService ?? throw new ArgumentNullException(nameof(platformIdentityService));

    public async Task<Guid?> TryResolveHolderUserIdAsync(
        ScopeContext scope,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        if (ArchitectureSharePlatformUserActorOid.TryParseUserId(actorId, out Guid platformUserId))
        {
            return platformUserId;
        }

        if (!ArchitectureWorkLeaseJwtActor.TryParseSubject(actorId, out string subjectOid, out Guid? tenantIdFromActor))
        {
            return null;
        }

        ExternalIdentityKey key = new()
        {
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            Subject = subjectOid,
            TenantId = tenantIdFromActor ?? scope.TenantId,
            NormalizedIssuer = string.Empty,
        };

        PlatformUserRecord? user =
            await _platformIdentityService.FindUserByAnyExternalIdentityAsync(key, cancellationToken);

        return user?.Id;
    }
}
