using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Queries;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>Surfaces per-corpus last-indexed metadata from the in-process index catalog (TB-046).</summary>
public sealed class RetrievalIndexFreshnessHealthCheck(
    IRetrievalDocumentIndexCatalog indexCatalog,
    IConfiguration configuration) : IHealthCheck
{
    public const string RegistrationName = "retrieval_index_freshness";

    private readonly IRetrievalDocumentIndexCatalog _indexCatalog =
        indexCatalog ?? throw new ArgumentNullException(nameof(indexCatalog));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RetrievalCorpusFreshnessSummary> summaries = _indexCatalog.GetCorpusFreshnessSummaries();

        if (summaries.Count == 0)
        {
            if (IsStartupCorpusIndexingDisabled() || IsInMemoryVectorIndex())
            {
                return Task.FromResult(
                    HealthCheckResult.Healthy(
                        "Startup corpus indexing disabled or in-memory retrieval index; empty catalog is expected."));
            }

            return Task.FromResult(
                HealthCheckResult.Degraded("No retrieval corpus documents indexed in this process yet."));
        }

        string description = string.Join(
            "; ",
            summaries.Select(static summary =>
                $"{summary.CorpusKind} docs={summary.DocumentCount} last={summary.LastIndexedUtc:u}"));

        return Task.FromResult(HealthCheckResult.Healthy(description));
    }

    private bool IsStartupCorpusIndexingDisabled()
    {
        return !ReadIndexOnStartup(PlatformDocCorpusIndexerOptions.SectionPath)
            && !ReadIndexOnStartup(PolicyPackCorpusIndexerOptions.SectionPath)
            && !ReadIndexOnStartup(ExemplarCorpusIndexerOptions.SectionPath);
    }

    private bool ReadIndexOnStartup(string sectionPath)
    {
        return _configuration.GetValue($"{sectionPath}:IndexOnStartup", true);
    }

    private bool IsInMemoryVectorIndex()
    {
        string? mode = _configuration["Retrieval:VectorIndex"];

        return string.Equals(mode, "InMemory", StringComparison.OrdinalIgnoreCase);
    }
}
