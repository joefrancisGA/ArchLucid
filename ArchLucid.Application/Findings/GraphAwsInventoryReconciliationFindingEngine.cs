using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Deterministic graph ↔ AWS inventory reconciliation findings (TB-2248).</summary>
public sealed class GraphAwsInventoryReconciliationFindingEngine(
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

    public string EngineType => "aws-inventory-reconciliation";

    public string Category => "Correctness";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? collectionUtc = await _packageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Aws, ct)
            .ConfigureAwait(false);

        if (InventoryCollectionFreshnessGate.ShouldSuppressInventoryFindings(
                collectionUtc,
                _clock.GetUtcNow().UtcDateTime,
                _freshnessOptions.StaleAfterDays))
        {
            return [];
        }

        CloudInventoryExtractorPackageDownloadRecord? download =
            await _packageRepository.TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Aws, ct)
                .ConfigureAwait(false);

        string? resourcesJson = download is null || download.PackageBytes.Length == 0
            ? null
            : CloudInventoryZipResourcesJsonReader.TryReadResourcesJson(download.PackageBytes);
        InventoryReconciliationResult reconciliation =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graphSnapshot);

        if (!reconciliation.HasMismatches)
            return [];

        IReadOnlyList<string> graphOnlyNodeIds = CollectGraphOnlyTopologyNodeIds(graphSnapshot, reconciliation);

        return
        [
            new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = FindingTypes.InventoryReconciliationFinding,
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = "Topology graph and AWS inventory are out of sync",
                Rationale =
                    "At least one topology resource identifier does not match the latest scoped AWS inventory snapshot.",
                RelatedNodeIds = graphOnlyNodeIds.ToList(),
                PayloadType = nameof(InventoryReconciliationFindingPayload),
                Payload = new InventoryReconciliationFindingPayload
                {
                    GraphTopologyResourceCount = reconciliation.GraphTopologyResourceCount,
                    InventoryResourceCount = reconciliation.InventoryResourceCount,
                    GraphOnlyResourceIds = reconciliation.GraphOnlyResourceIds.ToList(),
                    InventoryOnlyResourceIds = reconciliation.InventoryOnlyResourceIds.ToList()
                },
                RecommendedActions =
                [
                    "Update the architecture graph to include live inventory resources that are missing from the review.",
                    "Remove or re-label graph resources that are not present in the scoped AWS inventory."
                ],
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = graphOnlyNodeIds.ToList(),
                    RulesApplied = ["graph-aws-inventory-reconciliation"],
                    DecisionsTaken =
                    [
                        "Compared topology resource ARNs to scoped AWS inventory resources.json rows."
                    ],
                    AlternativePathsConsidered =
                    [
                        "Refresh the AWS inventory package before reconciling if collection is stale.",
                        "Mark planned-but-not-deployed graph resources explicitly as proposed rather than live."
                    ],
                    Notes =
                    [
                        $"Graph-only resources: {reconciliation.GraphOnlyResourceIds.Count}",
                        $"Inventory-only resources: {reconciliation.InventoryOnlyResourceIds.Count}"
                    ]
                }
            }
        ];
    }

    private static IReadOnlyList<string> CollectGraphOnlyTopologyNodeIds(
        GraphSnapshot graphSnapshot,
        InventoryReconciliationResult reconciliation)
    {
        if (reconciliation.GraphOnlyResourceIds.Count == 0)
            return [];

        HashSet<string> graphOnlyIds = reconciliation.GraphOnlyResourceIds
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> nodeIds = [];

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
        {
            string? resourceId = GraphAwsInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node);

            if (string.IsNullOrWhiteSpace(resourceId))
                continue;

            string normalized = GraphAwsInventoryReconciliationAnalyzer.NormalizeAwsResourceId(resourceId);

            if (graphOnlyIds.Contains(normalized))
                nodeIds.Add(node.NodeId);
        }

        return nodeIds;
    }
}
