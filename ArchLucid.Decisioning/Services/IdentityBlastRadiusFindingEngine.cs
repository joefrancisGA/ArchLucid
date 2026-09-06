using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Surfaces machine-actor paths to regulated datastores through write/admin role assignments (DX-06).
/// </summary>
public sealed class IdentityBlastRadiusFindingEngine : IFindingEngine
{
    public string EngineType => "identity-blast-radius";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<IdentityBlastRadiusPath> paths = IdentityPathAnalyzer.Analyze(graphSnapshot);

        if (paths.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = paths.Select(BuildFinding).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(IdentityBlastRadiusPath path)
    {
        List<string> relatedNodeIds = path.PathNodeIds
            .Where(static nodeId => !string.IsNullOrWhiteSpace(nodeId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> traceNotes = relatedNodeIds
            .Select(static nodeId => $"evidence:graph-node:{nodeId}")
            .ToList();

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "IdentityBlastRadiusFinding",
            Category = "Security",
            EngineType = "identity-blast-radius",
            Severity = FindingSeverity.Error,
            Title =
                $"Machine actor '{path.ActorLabel}' has {path.RoleName} access to regulated datastore '{path.DatastoreLabel}'",
            Rationale =
                $"A machine identity can reach datastore '{path.DatastoreLabel}' through role '{path.RoleName}' within {path.HopCount} graph hop(s).",
            DecisionConsequence =
                "Restrict role assignment scope, enforce private networking on the datastore, or document an approved exception before approval.",
            RelatedNodeIds = relatedNodeIds,
            PayloadType = nameof(IdentityBlastRadiusFindingPayload),
            Payload = new IdentityBlastRadiusFindingPayload
            {
                ActorNodeId = path.ActorNodeId,
                DatastoreNodeId = path.DatastoreNodeId,
                RoleName = path.RoleName,
                HopCount = path.HopCount,
            },
            RecommendedActions =
            [
                "Review whether the machine actor requires write/admin access to the regulated datastore.",
                "Prefer scoped roles and private endpoints for PCI or data-bearing resources.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["identity-blast-radius", path.RoleName],
                DecisionsTaken =
                [
                    "Machine actor path to regulated datastore through allow-listed write/admin role.",
                ],
                Notes = traceNotes,
            },
        };
    }
}
