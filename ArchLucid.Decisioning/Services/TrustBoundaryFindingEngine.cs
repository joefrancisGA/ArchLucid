using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Heuristic cross-trust-boundary checks when internal and external actors coexist (TB-2344).
/// </summary>
public sealed class TrustBoundaryFindingEngine(IComplianceRulePackProvider rulePackProvider) : IFindingEngine
{
    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    public string EngineType => "trust-boundary";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        ComplianceRulePack rulePack = await _rulePackProvider.GetRulePackAsync(ct).ConfigureAwait(false);
        HashSet<string> activeRuleIds = DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(rulePack);

        if (!GraphSecurityEnginePolicyThemeMap.TryGetTheme(EngineType, out string theme)
            || !DeclarationSignalPolicyGate.ShouldEmitTheme(theme, activeRuleIds))
        {
            return [];
        }

        string? policyRuleId = DeclarationSignalPolicyGate.TryGetPolicyRuleId(theme, activeRuleIds);
        IReadOnlyList<GraphNode> actorNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Actor);

        if (actorNodes.Count < 2)
            return [];

        bool hasInternal = actorNodes.Any(ActorOriginHeuristics.IsInternalActor);
        bool hasExternal = actorNodes.Any(ActorOriginHeuristics.IsExternalFacingActor);
        IReadOnlyList<GraphNode> trustBoundaryNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TrustBoundary);

        if (!hasInternal || !hasExternal || trustBoundaryNodes.Count > 0)
            return [];

        List<string> rulesApplied = policyRuleId is null
            ? ["trust-boundary-cross-origin"]
            : [policyRuleId, theme];

        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "TrustBoundaryFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = FindingSeverity.Warning,
            Title = "Mixed internal and external actors without trust-boundary segmentation",
            Rationale =
                "When both internal and external actors interact with the system, an explicit trust-boundary model is required to verify cross-boundary data flows.",
            PayloadType = nameof(TrustBoundaryFindingPayload),
            Payload = new TrustBoundaryFindingPayload
            {
                ActorCount = actorNodes.Count,
                InternalActorCount = actorNodes.Count(ActorOriginHeuristics.IsInternalActor),
                ExternalActorCount = actorNodes.Count(ActorOriginHeuristics.IsExternalFacingActor),
            },
            RelatedNodeIds = actorNodes.Select(static n => n.NodeId).ToList(),
            RecommendedActions =
            [
                "Model trust boundaries for each external-facing actor and verify ingress/egress controls.",
            ],
            PolicyRuleId = policyRuleId,
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = actorNodes.Select(static n => n.NodeId).ToList(),
                RulesApplied = rulesApplied,
                DecisionsTaken =
                [
                    "Detected internal and external actors with no TrustBoundary nodes.",
                ],
            },
        };

        return [finding];
    }
}
