using System.IO.Compression;
using System.Text;

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

        string? resourcesJson = TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
            return [];

        IReadOnlyList<OrphanedResourceFinding> orphans = OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        return orphans
            .Select(static orphan =>
            {
                IReadOnlyList<string> alternativePaths =
                    OrphanedAzureResourceExplainabilityAlternatives.ResolveForResourceType(orphan.ResourceType);

                return new Finding
                {
                    FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                    FindingType = "OrphanedAzureResource",
                    Category = orphan.Category,
                    EngineType = "orphaned-azure-resource",
                    Severity = FindingSeverity.Warning,
                    Title = $"Orphaned resource: {orphan.ResourceType}",
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
                        RulesApplied = ["orphaned-azure-resource-classifier"],
                        DecisionsTaken = ["Flagged unattached disk, NIC, public IP, load balancer, NSG, or route table from extractor inventory."],
                        AlternativePathsConsidered = alternativePaths.ToList(),
                        Notes = [$"Resource type: {orphan.ResourceType}", $"Resource id: {orphan.ResourceId}"],
                    },
                };
            })
            .ToList();
    }

    private static string? TryReadResourcesJson(byte[] packageBytes)
    {
        using MemoryStream stream = new(packageBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read, leaveOpen: false);
        ZipArchiveEntry? entry = archive.GetEntry("resources.json")
                               ?? archive.Entries.FirstOrDefault(static e =>
                                   e.Name.Equals("resources.json", StringComparison.OrdinalIgnoreCase));

        if (entry is null)
            return null;

        using StreamReader reader = new(entry.Open(), Encoding.UTF8);
        return reader.ReadToEnd();
    }
}
