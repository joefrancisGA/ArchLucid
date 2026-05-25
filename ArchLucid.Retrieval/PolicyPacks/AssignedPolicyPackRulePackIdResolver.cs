using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.PolicyPacks;

/// <summary>Resolves rule-pack ids assigned to a tenant/workspace/project scope.</summary>
public sealed class AssignedPolicyPackRulePackIdResolver(
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
        CancellationToken cancellationToken)
    {
        EffectivePolicyPackSet effective = await _policyPackResolver
            .ResolveAsync(tenantId, workspaceId, projectId, cancellationToken)
            .ConfigureAwait(false);

        string? templatesRoot = _corpusOptions.CurrentValue.PolicyPacksDirectory;
        HashSet<string> rulePackIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ResolvedPolicyPack pack in effective.Packs)
        {
            string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(pack, templatesRoot);

            if (!string.IsNullOrWhiteSpace(rulePackId))
                rulePackIds.Add(rulePackId);
        }

        return rulePackIds;
    }
}
