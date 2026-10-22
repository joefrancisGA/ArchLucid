using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Persistence.Ports;

public interface IFindingsSnapshotEvaluationConfidenceEnricher
{
    Task TryEnrichAsync(FindingsSnapshot snapshot, CancellationToken cancellationToken);
}
