using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Decisioning.Findings;

/// <summary>No-op enricher for hosts/tests that omit SQL/agent evaluation wiring.</summary>
public sealed class NullFindingsSnapshotEvaluationConfidenceEnricher : IFindingsSnapshotEvaluationConfidenceEnricher
{
    public Task TryEnrichAsync(FindingsSnapshot snapshot, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        cancellationToken.ThrowIfCancellationRequested();

        snapshot.EvaluationConfidenceEnrichmentSkipped = true;

        return Task.CompletedTask;
    }
}
