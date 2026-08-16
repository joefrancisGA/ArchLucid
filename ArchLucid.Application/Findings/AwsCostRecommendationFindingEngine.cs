using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic AWS cost recommendations from the latest scoped inventory ZIP (TB-2215).</summary>
public sealed class AwsCostRecommendationFindingEngine(
    IScopeContextProvider scopeContextProvider,
    ICloudInventoryExtractorPackageRepository packageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ICloudInventoryExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    public string EngineType => "aws-cost-recommendation";

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
                CloudProvider.Aws,
                EngineType,
                "AwsCostRecommendation",
                "AWS cost recommendation",
                "aws-cost-entry",
                "AWS cost recommendation grounded in extractor inventory evidence.",
                "extractor-aws-cost-json",
                "Emitted a typed finding for each AWS cost recommendation row in the inventory ZIP."),
            ct);
    }
}
