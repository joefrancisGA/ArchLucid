using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Flags linked datastore SKU/replication that is single-region when a requirement declares zone/geo/multi-region
///     redundancy (DX-25).
/// </summary>
public sealed class RequirementSkuTierFindingEngine : IFindingEngine
{
    public string EngineType => "requirement-sku-tier";

    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<RequirementSkuTierGap> gaps = RequirementSkuTierAnalyzer.Analyze(graphSnapshot);

        if (gaps.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = gaps.Select(BuildFinding).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(RequirementSkuTierGap gap)
    {
        string requiredText = FormatRequiredRedundancy(gap.RequiredRedundancy);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "RequirementSkuTierFinding",
            Category = "Requirement",
            EngineType = "requirement-sku-tier",
            Severity = FindingSeverity.Warning,
            Title =
                $"Requirement '{gap.RequirementLabel}' requires {requiredText} but datastore '{gap.DatastoreLabel}' declares {gap.ObservedSku}",
            Rationale =
                $"Linked datastore '{gap.DatastoreLabel}' declares single-region SKU/replication ({gap.ObservedSku}) while the requirement asks for {requiredText}.",
            DecisionConsequence =
                "Upgrade the datastore SKU/replication tier or revise the redundancy requirement before approval.",
            RelatedNodeIds = [gap.RequirementNodeId, gap.DatastoreNodeId],
            PayloadType = nameof(RequirementSkuTierFindingPayload),
            Payload = new RequirementSkuTierFindingPayload
            {
                RequirementNodeId = gap.RequirementNodeId,
                DatastoreNodeId = gap.DatastoreNodeId,
                RequiredRedundancy = requiredText,
                ObservedSku = gap.ObservedSku,
            },
            RecommendedActions =
            [
                "Configure zone-redundant, geo-redundant, or multi-region storage/SQL SKU that matches the requirement.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [gap.RequirementNodeId, gap.DatastoreNodeId],
                RulesApplied = ["requirement-sku-tier", "datastore-sku-reader"],
                DecisionsTaken =
                [
                    "Parsed redundancy requirement without matching SKU/replication tier on linked datastore.",
                ],
                Notes =
                [
                    $"evidence:graph-node:{gap.RequirementNodeId}",
                    $"evidence:graph-node:{gap.DatastoreNodeId}",
                ],
            },
        };
    }

    private static string FormatRequiredRedundancy(RequirementRedundancyLevel level) =>
        level switch
        {
            RequirementRedundancyLevel.Zone => "zone-redundant storage",
            RequirementRedundancyLevel.Geo => "geo-redundant storage",
            RequirementRedundancyLevel.MultiRegion => "multi-region storage",
            _ => level.ToString(),
        };
}
