using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

/// <summary>Shared AWS/GCP cost-recommendation analysis from a scoped inventory ZIP (TB-2215).</summary>
internal static class CloudCostRecommendationFindingAnalyzer
{
    public static async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        CloudCostRecommendationFindingRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ScopeContextProvider);
        ArgumentNullException.ThrowIfNull(request.PackageRepository);
        ArgumentNullException.ThrowIfNull(request.Clock);
        ArgumentNullException.ThrowIfNull(request.FreshnessOptions);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.EngineType);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.FindingType);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.DefaultTitle);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.DefaultIdPrefix);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Rationale);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.RuleApplied);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.DecisionTaken);

        ScopeContext scope = request.ScopeContextProvider.GetCurrentScope();
        DateTime? collectionUtc = await request.PackageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, request.CloudProvider, cancellationToken)
            .ConfigureAwait(false);

        if (InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
                collectionUtc,
                request.Clock.GetUtcNow().UtcDateTime,
                request.FreshnessOptions.StaleAfterDays))
        {
            return [];
        }

        CloudInventoryExtractorPackageDownloadRecord? download = await request.PackageRepository
            .TryGetLatestDownloadInScopeAsync(scope, request.CloudProvider, cancellationToken)
            .ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return [];
        }

        CloudInventoryCostRecommendationJson? costJson =
            CloudInventoryZipCostRecommendationReader.TryRead(download.PackageBytes);

        if (costJson is null)
        {
            return [];
        }

        IReadOnlyList<AdvisorCostRecommendationFinding> recommendations =
            ExtractorAdvisorCostClassifier.ClassifyFromAdvisorCostJson(
                costJson.Json,
                request.DefaultTitle,
                request.DefaultIdPrefix);

        return recommendations
            .Select(recommendation => MapFinding(request, costJson.EntryName, recommendation))
            .ToList();
    }

    private static Finding MapFinding(
        CloudCostRecommendationFindingRequest request,
        string entryName,
        AdvisorCostRecommendationFinding recommendation)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = request.FindingType,
            Category = "CostOptimization",
            EngineType = request.EngineType,
            Severity = FindingSeverity.Warning,
            Title = $"Cost recommendation: {recommendation.Title}",
            Rationale = request.Rationale,
            RelatedNodeIds = [],
            PayloadType = nameof(AdvisorCostRecommendationFindingPayload),
            Payload = new AdvisorCostRecommendationFindingPayload
            {
                ExtractorArtifactFileName = entryName,
                EntryIndex = recommendation.EntryIndex,
                RecommendationId = recommendation.RecommendationId,
                Title = recommendation.Title,
                Category = recommendation.Category,
                EstimatedAnnualSavingsUsd = recommendation.EstimatedAnnualSavingsUsd,
            },
            Trace = new ExplainabilityTrace
            {
                RulesApplied = [request.RuleApplied],
                DecisionsTaken = [request.DecisionTaken],
                AlternativePathsConsidered =
                [
                    "Accept the recommendation and track realized savings after implementation.",
                    "Dismiss the recommendation when the workload intentionally retains the current configuration."
                ],
                Notes =
                [
                    $"Evidence artifact: {entryName}",
                    $"Recommendation id: {recommendation.RecommendationId}",
                    $"Entry index: {recommendation.EntryIndex}",
                    recommendation.EstimatedAnnualSavingsUsd is null
                        ? "Estimated annual savings: not reported in extractor row."
                        : $"Estimated annual savings (USD): {recommendation.EstimatedAnnualSavingsUsd:0.##}",
                ],
            },
        };
    }
}
