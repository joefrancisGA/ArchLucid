using System.IO.Compression;
using System.Text;

using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic orphan-resource findings from the latest scoped extractor ZIP.</summary>
public sealed class OrphanedAzureResourceFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository packageRepository) : IFindingEngine
{
    public string EngineType => "orphaned-azure-resource";
    public string Category => "CostOptimization";

    /// <inheritdoc />
    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        _ = graphSnapshot;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        AzureExtractorPackageDownloadRecord? download =
            await packageRepository.TryGetLatestDownloadInScopeAsync(scope, ct).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
            return [];

        string? resourcesJson = TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
            return [];

        IReadOnlyList<OrphanedResourceFinding> orphans = OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        return orphans
            .Select(static orphan => new Finding
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
                    DecisionsTaken = ["Flagged unattached disk, NIC, or public IP from extractor inventory."],
                },
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
