using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantWorkOwnershipDeletePolicyService(
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : ITenantWorkOwnershipDeletePolicyService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public async Task<bool> GetAllowCreatorDeleteOwnedWorkAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.AllowCreatorDeleteOwnedWork, cancellationToken)
            .ConfigureAwait(false);

        if (stored is null)
            return true;

        return TenantSettingBooleanParser.TryParse(stored, out bool allow) ? allow : true;
    }

    public async Task<bool> SetAllowCreatorDeleteOwnedWorkAsync(
        bool allowCreatorDeleteOwnedWork,
        CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.AllowCreatorDeleteOwnedWork,
                TenantSettingBooleanParser.Format(allowCreatorDeleteOwnedWork),
                cancellationToken)
            .ConfigureAwait(false);

        return allowCreatorDeleteOwnedWork;
    }

    private Guid RequireTenantId()
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
            throw new InvalidOperationException("Tenant scope is required.");

        return tenantId;
    }
}
