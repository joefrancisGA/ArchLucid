using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.Queries;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Probes the configured RAG vector index with a lightweight scoped search. In-memory indexes always pass; Azure AI
///     Search failures can be surfaced as degraded (default) or unhealthy when explicitly configured.
/// </summary>
public sealed class VectorStoreHealthCheck(
    IConfiguration configuration,
    IServiceProvider serviceProvider) : IHealthCheck
{
    public const string RegistrationName = "vector_store";

    /// <inheritdoc />
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        string? vectorMode = configuration["Retrieval:VectorIndex"];

        if (string.IsNullOrWhiteSpace(vectorMode)
            || string.Equals(vectorMode, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            return HealthCheckResult.Healthy("Retrieval vector index uses InMemory (process-local).");
        }

        if (!string.Equals(vectorMode, "AzureSearch", StringComparison.OrdinalIgnoreCase))
        {
            return HealthCheckResult.Degraded(
                $"Retrieval:VectorIndex '{vectorMode}' is unrecognized; vector-store readiness probe skipped.");
        }

        IAzureSearchClient? searchClient = serviceProvider.GetService(typeof(IAzureSearchClient)) as IAzureSearchClient;

        if (searchClient is null || searchClient is NotConfiguredAzureSearchClient)
        {
            return MapFailure(
                configuration,
                "Azure AI Search is selected but IAzureSearchClient is not configured.");
        }

        IRetrievalQueryService? queryService =
            serviceProvider.GetService(typeof(IRetrievalQueryService)) as IRetrievalQueryService;

        if (queryService is null)
        {
            return MapFailure(
                configuration,
                "IRetrievalQueryService is not registered; vector-store readiness probe cannot run.");
        }

        try
        {
            RetrievalQuery probe = new()
            {
                TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                QueryText = "health probe",
                TopK = 1,
            };

            _ = await queryService.SearchAsync(probe, cancellationToken).ConfigureAwait(false);

            return HealthCheckResult.Healthy("Azure AI Search vector query succeeded.");
        }
        catch (Exception ex)
        {
            return MapFailure(configuration, "Azure AI Search vector query failed.", ex);
        }
    }

    private static HealthCheckResult MapFailure(
        IConfiguration configuration,
        string message,
        Exception? exception = null)
    {
        bool failReadiness = configuration.GetValue(
            "Retrieval:VectorStoreHealthCheck:FailReadinessWhenUnavailable",
            false);

        HealthStatus status = failReadiness ? HealthStatus.Unhealthy : HealthStatus.Degraded;

        return new HealthCheckResult(status, message, exception);
    }
}
