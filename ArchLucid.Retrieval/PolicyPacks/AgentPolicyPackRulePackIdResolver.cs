using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.PolicyPacks;

/// <summary>
///     Resolves indexed policy-pack <c>rulePackId</c> keys for agent-time retrieval,
///     optionally scoped to architecture-quality dimensions per agent type.
/// </summary>
public sealed class AgentPolicyPackRulePackIdResolver(
    IPolicyPackResolver policyPackResolver,
    IOptionsMonitor<PolicyPackCorpusIndexerOptions> corpusOptions)
{
    private readonly IPolicyPackResolver _policyPackResolver =
        policyPackResolver ?? throw new ArgumentNullException(nameof(policyPackResolver));

    private readonly IOptionsMonitor<PolicyPackCorpusIndexerOptions> _corpusOptions =
        corpusOptions ?? throw new ArgumentNullException(nameof(corpusOptions));

    public async Task<HashSet<string>> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        EffectivePolicyPackSet effective = await _policyPackResolver
            .ResolveAsync(tenantId, workspaceId, projectId, cancellationToken)
            .ConfigureAwait(false);

        string? templatesRoot = _corpusOptions.CurrentValue.PolicyPacksDirectory;
        HashSet<string> rulePackIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ResolvedPolicyPack pack in effective.Packs)
        {
            if (!AgentPolicyPackRetrievalProfiles.IncludesPack(agentType, pack.QualityDimension))
                continue;

            string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(pack, templatesRoot);

            if (!string.IsNullOrWhiteSpace(rulePackId))
                rulePackIds.Add(rulePackId);
        }

        return rulePackIds;
    }
}
