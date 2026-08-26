namespace ArchLucid.Application.Findings;

/// <summary>Merges host <see cref="PortfolioRecurrenceFindingOptions" /> with per-tenant <c>dbo.TenantSettings</c> overrides.</summary>
public interface IPortfolioRecurrenceFindingOptionsResolver
{
    PortfolioRecurrenceFindingOptions Resolve(CancellationToken cancellationToken = default);
}
