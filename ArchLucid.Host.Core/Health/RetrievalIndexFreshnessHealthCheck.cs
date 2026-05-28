using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>Surfaces per-corpus last-indexed metadata from the in-process index catalog (TB-046).</summary>
public sealed class RetrievalIndexFreshnessHealthCheck(
    IRetrievalDocumentIndexCatalog indexCatalog) : IHealthCheck
{
    public const string RegistrationName = "retrieval_index_freshness";

    private readonly IRetrievalDocumentIndexCatalog _indexCatalog =
        indexCatalog ?? throw new ArgumentNullException(nameof(indexCatalog));

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RetrievalCorpusFreshnessSummary> summaries = _indexCatalog.GetCorpusFreshnessSummaries();

        if (summaries.Count == 0)
        {
            return Task.FromResult(
                HealthCheckResult.Degraded("No retrieval corpus documents indexed in this process yet."));
        }

        string description = string.Join(
            "; ",
            summaries.Select(static summary =>
                $"{summary.CorpusKind} docs={summary.DocumentCount} last={summary.LastIndexedUtc:u}"));

        return Task.FromResult(HealthCheckResult.Healthy(description));
    }
}
