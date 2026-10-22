namespace ArchLucid.Core.CustomerSuccess;

/// <summary>Platform admin read model for tenant health scores and activity signals.</summary>
public interface IAdminTenantHealthReader
{
    Task<IReadOnlyList<AdminTenantHealthSummaryRow>> ListSummariesAsync(CancellationToken cancellationToken);
}
