using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public interface IPortfolioRunScanSource
{
    Task<IReadOnlyList<KeyValuePair<string, RunSummary>>> CollectLatestCommittedSystemsAsync(
        int maxSystemsScanned,
        CancellationToken cancellationToken);
}
