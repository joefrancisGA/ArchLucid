using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed class NullTenantTrialEmailContactLookup : ITenantTrialEmailContactLookup
{
    /// <inheritdoc />
    public Task<string?> TryResolveAdminEmailAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = cancellationToken;

        return Task.FromResult<string?>(null);
    }
}
