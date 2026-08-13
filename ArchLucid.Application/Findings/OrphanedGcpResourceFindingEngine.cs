using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic orphan-resource findings from the latest scoped GCP inventory ZIP (TB-2218).</summary>
public sealed class OrphanedGcpResourceFindingEngine(
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

    public string EngineType => "orphaned-gcp-resource";

    public string Category => "CostOptimization";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        _ = graphSnapshot;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? collectionUtc = await _packageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Gcp, ct)
            .ConfigureAwait(false);

        if (InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
                collectionUtc,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return [];
        }

        CloudInventoryExtractorPackageDownloadRecord? download =
            await _packageRepository.TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Gcp, ct)
                .ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
        {
            return [];
        }

        string? resourcesJson = CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
        {
            return [];
        }

        IReadOnlyList<OrphanedResourceFinding> orphans =
            OrphanedGcpResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        return orphans
            .Select(static orphan =>
            {
                IReadOnlyList<string> alternativePaths =
                    OrphanedGcpResourceExplainabilityAlternatives.ResolveForResourceType(orphan.ResourceType);

                return new Finding
                {
                    FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                    FindingType = "OrphanedGcpResource",
                    Category = orphan.Category,
                    EngineType = "orphaned-gcp-resource",
                    Severity = FindingSeverity.Warning,
                    Title = $"Orphaned GCP resource: {orphan.ResourceType}",
                    Rationale = orphan.Message,
                    RelatedNodeIds = [],
                    PayloadType = nameof(RequirementFindingPayload),
                    Payload = new RequirementFindingPayload
                    {
                        RequirementName = orphan.ResourceId,
                        RequirementText = orphan.Message,
                        IsMandatory = false,
                    },
                    Trace = new ExplainabilityTrace
                    {
                        RulesApplied = ["orphaned-gcp-resource-classifier"],
                        DecisionsTaken = ["Flagged unattached disk or static IP from GCP inventory."],
                        AlternativePathsConsidered = alternativePaths.ToList(),
                        Notes = [$"Resource type: {orphan.ResourceType}", $"Resource id: {orphan.ResourceId}"],
                    },
                };
            })
            .ToList();
    }
}
