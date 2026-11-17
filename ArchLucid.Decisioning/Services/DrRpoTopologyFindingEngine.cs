using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Flags datastore topology that lacks replica/failover declaration evidence when a linked requirement states
///     RPO/RTO targets (DX-08).
/// </summary>
public sealed class DrRpoTopologyFindingEngine : IFindingEngine
{
    public string EngineType => "dr-rpo-topology";

    public string Category => "Requirement";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<DrRpoTopologyGap> gaps = DrRpoTopologyAnalyzer.Analyze(graphSnapshot);

        if (gaps.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = gaps.Select(gap => BuildFinding(graphSnapshot, gap)).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(GraphSnapshot graphSnapshot, DrRpoTopologyGap gap)
    {
        string objectiveText = BuildObjectiveText(gap.RpoMinutes, gap.RtoMinutes);
        bool unlinkedRecovery = string.IsNullOrWhiteSpace(gap.DatastoreNodeId);
        List<string> relatedNodeIds = unlinkedRecovery
            ? [gap.RequirementNodeId]
            : [gap.RequirementNodeId, gap.DatastoreNodeId];
        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            graphSnapshot,
            relatedNodeIds);

        List<string> traceNotes =
        [
            $"evidence:graph-node:{gap.RequirementNodeId}",
        ];

        if (!unlinkedRecovery)
        {
            traceNotes.Add($"evidence:graph-node:{gap.DatastoreNodeId}");
        }

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DrRpoTopologyFinding",
            Category = "Requirement",
            EngineType = "dr-rpo-topology",
            Severity = FindingSeverity.Warning,
            Title = unlinkedRecovery
                ? $"Requirement '{gap.RequirementLabel}' declares {objectiveText} but {gap.DatastoreLabel}"
                : $"Requirement '{gap.RequirementLabel}' declares {objectiveText} but datastore '{gap.DatastoreLabel}' lacks replica or failover properties",
            Rationale = unlinkedRecovery
                ? $"Requirement '{gap.RequirementLabel}' states {objectiveText}, but no linked recovery datastore was stored on the graph."
                : $"Linked datastore '{gap.DatastoreLabel}' does not declare geo-replica, failover group, or equivalent recovery topology for {objectiveText}.",
            DecisionConsequence = unlinkedRecovery
                ? "Link the requirement to a recovery datastore on the graph or revise the stated recovery objective before approval."
                : "Add replica, failover group, or geo-redundant configuration to the linked datastore or revise the stated recovery objective before approval.",
            RelatedNodeIds = relatedNodeIds,
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(DrRpoTopologyFindingPayload),
            Payload = new DrRpoTopologyFindingPayload
            {
                RequirementNodeId = gap.RequirementNodeId,
                DatastoreNodeId = gap.DatastoreNodeId,
                RpoMinutes = gap.RpoMinutes,
                RtoMinutes = gap.RtoMinutes,
            },
            RecommendedActions =
            [
                unlinkedRecovery
                    ? "Store a linked recovery datastore on the graph or revise the declared recovery objective."
                    : "Configure geo-redundant storage, SQL failover group, or read replicas that meet the declared recovery objective.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["dr-rpo-topology", "replica-property-heuristic"],
                DecisionsTaken =
                [
                    unlinkedRecovery
                        ? "Parsed recovery objective on requirement without a stored linked recovery datastore."
                        : "Parsed recovery objective on requirement without matching replica declaration on linked datastore.",
                ],
                Notes = traceNotes,
            },
        };
    }

    private static string BuildObjectiveText(int? rpoMinutes, int? rtoMinutes)
    {
        if (rpoMinutes is not null && rtoMinutes is not null)
        {
            return $"RPO {rpoMinutes} min and RTO {rtoMinutes} min";
        }

        if (rpoMinutes is not null)
        {
            return $"RPO {rpoMinutes} min";
        }

        return $"RTO {rtoMinutes} min";
    }
}
