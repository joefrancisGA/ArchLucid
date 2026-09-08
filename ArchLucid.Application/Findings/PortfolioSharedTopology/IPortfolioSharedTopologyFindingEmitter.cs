using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

public interface IPortfolioSharedTopologyFindingEmitter
{
    IReadOnlyList<Finding> EmitFindings(
        IReadOnlyList<SharedTopologyConflict> conflicts,
        PortfolioSharedTopologyFindingOptions options);
}
