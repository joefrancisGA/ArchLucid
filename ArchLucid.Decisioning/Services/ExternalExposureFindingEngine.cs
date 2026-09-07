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
///     Flags external or anonymous actors that lack an explicit trust-boundary node (TB-2344).
/// </summary>
public sealed class ExternalExposureFindingEngine(IComplianceRulePackProvider rulePackProvider) : IFindingEngine
{
    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    public string EngineType => "external-exposure";

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
        IReadOnlyList<GraphNode> trustBoundaryNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TrustBoundary);
        List<Finding> findings = [];

        foreach (GraphNode actor in actorNodes)
        {
            if (!ActorOriginHeuristics.IsExternalFacingActor(actor))
                continue;

            bool hasBoundary = trustBoundaryNodes.Any(boundary =>
                boundary.Properties.TryGetValue("actorNodeId", out string? actorNodeId)
                && string.Equals(actorNodeId, actor.NodeId, StringComparison.OrdinalIgnoreCase));

            if (hasBoundary)
                continue;

            string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.NodeId : actor.Label;
            List<string> rulesApplied = policyRuleId is null
                ? ["external-exposure-trust-boundary"]
                : [policyRuleId, theme];

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "ExternalExposureFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Warning,
                Title = $"External actor '{label}' lacks an explicit trust boundary",
                Rationale =
                    "External or anonymous actors must be modeled with TrustBoundary nodes so security engines can verify cross-boundary controls.",
                PayloadType = nameof(ExternalExposureFindingPayload),
                Payload = new ExternalExposureFindingPayload
                {
                    ActorNodeId = actor.NodeId,
                    ActorLabel = label,
                    TrustOrigin = actor.Properties.GetValueOrDefault("trustOrigin") ?? "unknown",
                },
                RelatedNodeIds = [actor.NodeId],
                RecommendedActions =
                [
                    "Add a TrustBoundary node linked to the external actor and document ingress controls.",
                ],
                PolicyRuleId = policyRuleId,
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [actor.NodeId],
                    RulesApplied = rulesApplied,
                    DecisionsTaken =
                    [
                        "External-facing actor present without matching TrustBoundary node.",
                    ],
                },
            });
        }

        return findings;
    }
}
