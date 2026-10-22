using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Surfaces internal human actors for privileged-access review (TB-2344).
/// </summary>
public sealed class PrivilegedAccessFindingEngine(IComplianceRulePackProvider rulePackProvider) : IFindingEngine
{
    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    public string EngineType => "privileged-access";

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
        List<GraphNode> privilegedActors = graphSnapshot
            .GetNodesByType(GraphNodeTypes.Actor)
            .Where(IsInternalHumanActor)
            .ToList();

        if (privilegedActors.Count == 0)
            return [];

        List<Finding> findings = [];

        foreach (GraphNode actor in privilegedActors)
        {
            string label = string.IsNullOrWhiteSpace(actor.Label) ? actor.NodeId : actor.Label;
            List<string> rulesApplied = policyRuleId is null
                ? ["privileged-access-internal-human"]
                : [policyRuleId, theme];

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "PrivilegedAccessFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = $"Review privileged access for internal human actor '{label}'",
                Rationale =
                    "Internal human actors typically require explicit privileged-access and session controls in the target architecture.",
                PayloadType = nameof(PrivilegedAccessFindingPayload),
                Payload = new PrivilegedAccessFindingPayload
                {
                    ActorNodeId = actor.NodeId,
                    ActorLabel = label,
                    Kind = actor.Properties.GetValueOrDefault("kind") ?? "Human",
                },
                RelatedNodeIds = [actor.NodeId],
                RecommendedActions =
                [
                    "Document IdP/MFA requirements and least-privilege roles for this actor surface.",
                ],
                PolicyRuleId = policyRuleId,
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [actor.NodeId],
                    RulesApplied = rulesApplied,
                    DecisionsTaken =
                    [
                        "Internal human actor requires privileged-access verification.",
                    ],
                },
            });
        }

        return findings;
    }

    private static bool IsInternalHumanActor(GraphNode actor)
    {
        if (!actor.Properties.TryGetValue("trustOrigin", out string? trustOrigin)
            || !string.Equals(trustOrigin, "Internal", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!actor.Properties.TryGetValue("kind", out string? kind))
            return false;

        return string.Equals(kind, "Human", StringComparison.OrdinalIgnoreCase)
            || string.Equals(kind, "Both", StringComparison.OrdinalIgnoreCase);
    }
}
