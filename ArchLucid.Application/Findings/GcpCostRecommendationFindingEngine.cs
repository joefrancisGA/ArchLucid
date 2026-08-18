using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic GCP cost recommendations from the latest scoped inventory ZIP (TB-2215).</summary>
public sealed class GcpCostRecommendationFindingEngine(
    IScopeContextProvider scopeContextProvider,
    ICloudInventoryExtractorPackageRepository packageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ICloudInventoryExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    public string EngineType => "gcp-cost-recommendation";

    public string Category => "CostOptimization";

    /// <inheritdoc />
    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        return CloudCostRecommendationFindingAnalyzer.AnalyzeAsync(
            new CloudCostRecommendationFindingRequest(
                _scopeContextProvider,
                _packageRepository,
                _clock,
                _freshnessOptions,
                CloudProvider.Gcp,
                EngineType,
                "GcpCostRecommendation",
                "GCP cost recommendation",
                "gcp-cost-entry",
                "GCP Recommender cost recommendation grounded in extractor inventory evidence.",
                "extractor-gcp-cost-json",
                "Emitted a typed finding for each GCP cost recommendation row in the inventory ZIP."),
            ct);
    }
}
