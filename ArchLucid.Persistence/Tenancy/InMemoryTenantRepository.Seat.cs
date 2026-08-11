using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{

    /// <inheritdoc />
    public Task<bool> TryIncrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) || t.EnterpriseSeatsLimit is { } lim && t.EnterpriseSeatsUsed >= lim)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(t, enterpriseSeatsUsedOverride: t.EnterpriseSeatsUsed + 1);
        }

        return Task.FromResult(true);
    }


    /// <inheritdoc />
    public Task DecrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t))
                return Task.CompletedTask;

            int next = t.EnterpriseSeatsUsed > 0 ? t.EnterpriseSeatsUsed - 1 : 0;
            _byId[tenantId] = CopyTenant(t, enterpriseSeatsUsedOverride: next);
        }

        return Task.CompletedTask;
    }
}
