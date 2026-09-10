namespace ArchLucid.Application.Findings;

public interface IPortfolioSharedTopologyFindingOptionsResolver
{
    PortfolioSharedTopologyFindingOptions Resolve(CancellationToken cancellationToken = default);
}
