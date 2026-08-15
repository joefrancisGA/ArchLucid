using ArchLucid.Application.Analysis;
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

/// <summary>Deterministic orphan-resource findings from the latest scoped extractor ZIP.</summary>
public sealed class OrphanedAzureResourceFindingEngine(
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

    public string EngineType => "orphaned-azure-resource";
    public string Category => "CostOptimization";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

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

        string? orphanCandidatesJson =
            AzureInventoryZipJsonEntryReader.TryReadEntry(download.PackageBytes, "orphan-candidates.json");

        IReadOnlyList<ExtractorOrphanCandidateFinding> extractorOrphans = [];
        IReadOnlyList<OrphanedResourceFinding> orphans;
        bool extractorOrphanCandidatesGrounded;
        string rulesApplied;

        if (orphanCandidatesJson is not null
            && !string.IsNullOrWhiteSpace(orphanCandidatesJson))
        {
            extractorOrphans = ExtractorOrphanCandidatesClassifier.ClassifyFromOrphanCandidatesJson(orphanCandidatesJson);
        }

        if (extractorOrphans.Count > 0)
        {
            orphans = extractorOrphans
                .Select(static candidate => new OrphanedResourceFinding(
                    candidate.ResourceId,
                    candidate.ResourceType,
                    candidate.Message,
                    candidate.Category))
                .ToList();

            extractorOrphanCandidatesGrounded = true;
            rulesApplied = "extractor-orphan-candidates-json";
        }
        else
        {
            string? resourcesJson = AzureInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);

            if (string.IsNullOrWhiteSpace(resourcesJson))
                return [];

            orphans = OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);
            extractorOrphanCandidatesGrounded = false;
            rulesApplied = "orphaned-azure-resource-classifier";
        }

        Dictionary<string, ExtractorOrphanCandidateFinding> extractorOrphansByResourceId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (ExtractorOrphanCandidateFinding candidate in extractorOrphans)
        {
            extractorOrphansByResourceId.TryAdd(candidate.ResourceId, candidate);
        }

        InventoryTopologyResourceNodeIndex topologyNodes =
            InventoryTopologyResourceNodeIndex.Build(graphSnapshot, InventoryTopologyCloudProvider.Azure);

        return orphans
            .Select(orphan =>
            {
                IReadOnlyList<string> alternativePaths =
                    OrphanedAzureResourceExplainabilityAlternatives.ResolveForResourceType(orphan.ResourceType);

                extractorOrphansByResourceId.TryGetValue(orphan.ResourceId, out ExtractorOrphanCandidateFinding? extractorOrphan);
                int entryIndex = extractorOrphan?.EntryIndex ?? -1;
                decimal? annualSavingsUsd = extractorOrphan?.EstimatedAnnualSavingsUsd;

                return new Finding
                {
                    FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                    FindingType = "OrphanedAzureResource",
                    Category = orphan.Category,
                    EngineType = "orphaned-azure-resource",
                    Severity = FindingSeverity.Warning,
                    Title = $"Orphaned resource: {orphan.ResourceType}",
                    Rationale = orphan.Message,
                    RelatedNodeIds = topologyNodes.Resolve(orphan.ResourceId).ToList(),
                    PayloadType = extractorOrphanCandidatesGrounded
                        ? nameof(ExtractorOrphanCandidateFindingPayload)
                        : nameof(RequirementFindingPayload),
                    Payload = extractorOrphanCandidatesGrounded
                        ? new ExtractorOrphanCandidateFindingPayload
                        {
                            ExtractorArtifactFileName = "orphan-candidates.json",
                            EntryIndex = entryIndex,
                            ResourceId = orphan.ResourceId,
                            ResourceType = orphan.ResourceType,
                            Reason = orphan.Message,
                            EstimatedAnnualSavingsUsd = annualSavingsUsd,
                        }
                        : new RequirementFindingPayload
                        {
                            RequirementName = orphan.ResourceId,
                            RequirementText = orphan.Message,
                            IsMandatory = false,
                        },
                    Trace = new ExplainabilityTrace
                    {
                        RulesApplied = [rulesApplied],
                        DecisionsTaken =
                        [
                            extractorOrphanCandidatesGrounded
                                ? "Flagged orphan candidates from extractor orphan-candidates.json."
                                : "Flagged unattached disk, NIC, public IP, load balancer, NSG, or route table from extractor inventory."
                        ],
                        AlternativePathsConsidered = alternativePaths.ToList(),
                        Notes = BuildTraceNotes(orphan, extractorOrphanCandidatesGrounded, entryIndex, annualSavingsUsd),
                    },
                };
            })
            .ToList();
    }

    private static List<string> BuildTraceNotes(
        OrphanedResourceFinding orphan,
        bool extractorOrphanCandidatesGrounded,
        int entryIndex,
        decimal? annualSavingsUsd)
    {
        List<string> notes =
        [
            $"Resource type: {orphan.ResourceType}",
            $"Resource id: {orphan.ResourceId}",
        ];

        if (!extractorOrphanCandidatesGrounded)
            return notes;

        notes.Add("Evidence artifact: orphan-candidates.json");

        if (entryIndex >= 0)
            notes.Add($"Entry index: {entryIndex}");

        if (annualSavingsUsd is not null)
            notes.Add($"Estimated annual savings (USD): {annualSavingsUsd:0.##}");

        return notes;
    }
}
