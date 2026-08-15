using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic Azure Advisor cost recommendations from scoped extractor <c>advisor-cost.json</c> (TB-2213).</summary>
public sealed class AdvisorCostRecommendationFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository packageRepository,
    TimeProvider clock,
    IOptions<RoiCostEvidenceFreshnessOptions> freshnessOptions) : IFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly RoiCostEvidenceFreshnessOptions _freshnessOptions =
        freshnessOptions?.Value ?? throw new ArgumentNullException(nameof(freshnessOptions));

    public string EngineType => "advisor-cost-recommendation";

    public string Category => "CostOptimization";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        _ = graphSnapshot;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? collectionUtc = await _packageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, ct)
            .ConfigureAwait(false);

        if (InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
                collectionUtc,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return [];
        }

        AzureExtractorPackageDownloadRecord? download =
            await _packageRepository.TryGetLatestDownloadInScopeAsync(scope, ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
            return [];

        string? advisorCostJson = AzureInventoryZipJsonEntryReader.TryReadEntry(download.PackageBytes, "advisor-cost.json");

        if (string.IsNullOrWhiteSpace(advisorCostJson))
            return [];

        IReadOnlyList<AdvisorCostRecommendationFinding> recommendations =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(advisorCostJson);

        return recommendations
            .Select(static recommendation => new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "AdvisorCostRecommendation",
                Category = "CostOptimization",
                EngineType = "advisor-cost-recommendation",
                Severity = FindingSeverity.Warning,
                Title = $"Advisor cost recommendation: {recommendation.Title}",
                Rationale =
                    "Azure Advisor cost recommendation grounded in extractor advisor-cost.json inventory evidence.",
                RelatedNodeIds = [],
                PayloadType = nameof(AdvisorCostRecommendationFindingPayload),
                Payload = new AdvisorCostRecommendationFindingPayload
                {
                    ExtractorArtifactFileName = "advisor-cost.json",
                    EntryIndex = recommendation.EntryIndex,
                    RecommendationId = recommendation.RecommendationId,
                    Title = recommendation.Title,
                    Category = recommendation.Category,
                    EstimatedAnnualSavingsUsd = recommendation.EstimatedAnnualSavingsUsd,
                },
                Trace = new ExplainabilityTrace
                {
                    RulesApplied = ["extractor-advisor-cost-json"],
                    DecisionsTaken =
                    [
                        "Emitted a typed finding for each Advisor cost recommendation row in advisor-cost.json."
                    ],
                    AlternativePathsConsidered =
                    [
                        "Accept the recommendation and track realized savings after implementation.",
                        "Dismiss the recommendation when the workload intentionally retains the current configuration."
                    ],
                    Notes =
                    [
                        "Evidence artifact: advisor-cost.json",
                        $"Recommendation id: {recommendation.RecommendationId}",
                        $"Entry index: {recommendation.EntryIndex}",
                        recommendation.EstimatedAnnualSavingsUsd is null
                            ? "Estimated annual savings: not reported in extractor row."
                            : $"Estimated annual savings (USD): {recommendation.EstimatedAnnualSavingsUsd:0.##}",
                    ],
                },
            })
            .ToList();
    }
}
