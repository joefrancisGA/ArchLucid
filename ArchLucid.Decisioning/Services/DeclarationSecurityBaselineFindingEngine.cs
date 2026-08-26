using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Emits deterministic security findings from declaration-ingested graph node properties (<c>tf.*</c>, ARM, Bicep).
///     Honors tenant compliance rule keys via <see cref="DeclarationSignalPolicyKeyMap" /> when the filtered pack
///     includes mapped cis-az / sec-base ids; otherwise emits all classifier signals (fail-open).
/// </summary>
public sealed class DeclarationSecurityBaselineFindingEngine(IComplianceRulePackProvider rulePackProvider) : IFindingEngine
{
    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    public string EngineType => "declaration-security-baseline";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        ComplianceRulePack rulePack = await _rulePackProvider.GetRulePackAsync(ct);
        HashSet<string> activeRuleIds = DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(rulePack);

        List<Finding> findings = [];

        foreach (GraphNode node in graphSnapshot.GetNodesByType("TopologyResource"))
            AddFindingsForNode(node, activeRuleIds, findings);

        foreach (GraphNode node in graphSnapshot.GetNodesByType("SecurityBaseline"))
            AddFindingsForNode(node, activeRuleIds, findings);

        return findings;
    }

    private static void AddFindingsForNode(
        GraphNode node,
        IReadOnlySet<string> activeRuleIds,
        List<Finding> findings)
    {
        string label = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label;
        IReadOnlyList<DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal> signals =
            DeclarationSecurityBaselineClassifier.Classify(label, node.Properties);

        foreach (DeclarationSecurityBaselineClassifier.DeclarationSecurityBaselineSignal signal in signals)
        {
            if (!DeclarationSignalPolicyGate.ShouldEmitTheme(signal.Theme, activeRuleIds))
                continue;

            string? policyRuleId = DeclarationSignalPolicyGate.TryGetPolicyRuleId(signal.Theme, activeRuleIds);
            List<string> rulesApplied = policyRuleId is null
                ? ["declaration-security-baseline", signal.Theme]
                : [policyRuleId, signal.Theme];

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "DeclarationSecurityBaselineFinding",
                Category = "Security",
                EngineType = "declaration-security-baseline",
                Severity = signal.Severity,
                Title = signal.Title,
                Rationale =
                    "Infrastructure declaration properties on the knowledge graph indicate a security posture risk.",
                RelatedNodeIds = [node.NodeId],
                RecommendedActions =
                [
                    "Review the cited declaration attribute and align the resource with your security baseline.",
                ],
                PolicyRuleId = policyRuleId,
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [node.NodeId],
                    RulesApplied = rulesApplied,
                    DecisionsTaken =
                    [
                        "Unsafe or weak declaration attribute present on ingested infrastructure object.",
                    ],
                },
            });
        }
    }
}
