using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
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

        List<Finding> findings = gaps.Select(BuildFinding).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(DrRpoTopologyGap gap)
    {
        string objectiveText = BuildObjectiveText(gap.RpoMinutes, gap.RtoMinutes);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DrRpoTopologyFinding",
            Category = "Requirement",
            EngineType = "dr-rpo-topology",
            Severity = FindingSeverity.Warning,
            Title =
                $"Requirement '{gap.RequirementLabel}' declares {objectiveText} but datastore '{gap.DatastoreLabel}' lacks replica or failover properties",
            Rationale =
                $"Linked datastore '{gap.DatastoreLabel}' does not declare geo-replica, failover group, or equivalent recovery topology for {objectiveText}.",
            DecisionConsequence =
                "Add replica, failover group, or geo-redundant configuration to the linked datastore or revise the stated recovery objective before approval.",
            RelatedNodeIds = [gap.RequirementNodeId, gap.DatastoreNodeId],
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
                "Configure geo-redundant storage, SQL failover group, or read replicas that meet the declared recovery objective.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [gap.RequirementNodeId, gap.DatastoreNodeId],
                RulesApplied = ["dr-rpo-topology", "replica-property-heuristic"],
                DecisionsTaken =
                [
                    "Parsed recovery objective on requirement without matching replica declaration on linked datastore.",
                ],
                Notes =
                [
                    $"evidence:graph-node:{gap.RequirementNodeId}",
                    $"evidence:graph-node:{gap.DatastoreNodeId}",
                ],
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
