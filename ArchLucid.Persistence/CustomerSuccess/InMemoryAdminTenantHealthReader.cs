using ArchLucid.Core.CustomerSuccess;

namespace ArchLucid.Persistence.CustomerSuccess;

public sealed class InMemoryAdminTenantHealthReader : IAdminTenantHealthReader
{
    public Task<IReadOnlyList<AdminTenantHealthSummaryRow>> ListSummariesAsync(CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult<IReadOnlyList<AdminTenantHealthSummaryRow>>([]);
    }
}
