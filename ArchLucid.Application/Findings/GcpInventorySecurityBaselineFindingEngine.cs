using ArchLucid.Contracts.Architecture;
using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic security-baseline findings from scoped GCP inventory ZIP (TB-2262).</summary>
public sealed class GcpInventorySecurityBaselineFindingEngine(
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

    public string EngineType => "gcp-inventory-security-baseline";

    public string Category => "Security";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (EffectfulFindingEngineCollectionFreshness.ShouldSuppressInventoryFindingsForCloud(
                analysisContext,
                CloudProvider.Gcp,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return [];
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        CloudInventoryExtractorPackageDownloadRecord? download =
            await EffectfulFindingEngineEvidenceLoader.TryResolveCloudDownloadAsync(
                _packageRepository,
                scope,
                CloudProvider.Gcp,
                analysisContext,
                ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return [];
        }

        string? resourcesJson = CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return [];
        }

        IReadOnlyList<InventorySecurityBaselineFinding> gaps =
            GcpInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        InventoryTopologyResourceNodeIndex topologyNodes =
            InventoryTopologyResourceNodeIndex.Build(graphSnapshot, InventoryTopologyCloudProvider.Gcp);

        return gaps
            .Select(gap => InventorySecurityBaselineFindingMapper.ToFinding(
                gap,
                EngineType,
                "GcpInventorySecurityBaseline",
                "GCP",
                topologyNodes))
            .ToList();
    }
}
