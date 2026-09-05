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
///     Emits premise-conflict findings when ingested declaration properties contradict linked security or policy intent.
///     Intentionally complements <see cref="DeclarationSecurityBaselineFindingEngine" />:
///     ADR 0063 merge keeps both when identities differ — one states the unsafe value, the other states the contradiction.
///     Uses the same <see cref="DeclarationSignalPolicyKeyMap" /> gate as the baseline engine.
/// </summary>
public sealed partial class DeclarationPremiseConflictFindingEngine(IComplianceRulePackProvider rulePackProvider) : IFindingEngine
{
    private readonly IComplianceRulePackProvider _rulePackProvider =
        rulePackProvider ?? throw new ArgumentNullException(nameof(rulePackProvider));

    public string EngineType => "declaration-premise-conflict";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        ComplianceRulePack rulePack = await _rulePackProvider.GetRulePackAsync(ct);
        HashSet<string> activeRuleIds = DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(rulePack);

        List<Finding> findings = [];

        foreach (GraphNode topologyNode in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
            EmitFindingsForNode(graphSnapshot, topologyNode, activeRuleIds, findings);

        return findings;
    }
}
