using System.Text.Json;

using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

/// <summary>
///     Merges file-backed <see cref="ComplianceRulePack" /> rules with tenant rules embedded in effective governance
///     (<see cref="PolicyPackCuratedRulesMetadataKey.V1" />), then <see cref="ComplianceRulePackGovernanceFilter" /> runs.
/// </summary>
/// <remarks>
///     Merge order: preserve file-pack ordering; replace any file rule whose <see cref="ComplianceRule.RuleId" /> matches a
///     curated rule (case-insensitive); append curated-only rules (not present in the file pack) in curated JSON order.
/// </remarks>
public static class TenantCuratedComplianceRulePackMerger
{
    /// <summary>
    ///     Returns <paramref name="filePack" /> unchanged when metadata is absent, blank, or has no rules; otherwise a new
    ///     pack instance with merged <see cref="ComplianceRulePack.Rules" />.
    /// </summary>
    /// <exception cref="InvalidOperationException">Metadata key exists but JSON is invalid.</exception>
    public static ComplianceRulePack MergeFilePackWithCuratedFromGovernance(
        ComplianceRulePack filePack,
        PolicyPackContentDocument effective)
    {
        if (filePack is null) throw new ArgumentNullException(nameof(filePack));
        if (effective is null) throw new ArgumentNullException(nameof(effective));
        if (!effective.Metadata.TryGetValue(PolicyPackCuratedRulesMetadataKey.V1, out string? raw) ||
            string.IsNullOrWhiteSpace(raw))
            return filePack;

        CuratedPolicyPackRulesDocument? doc;

        try
        {
            doc = JsonSerializer.Deserialize<CuratedPolicyPackRulesDocument>(raw, PolicyPackJsonSerializerOptions.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Policy pack metadata '{PolicyPackCuratedRulesMetadataKey.V1}' is not valid JSON.",
                ex);
        }

        if (doc?.Rules is null || doc.Rules.Count == 0)
            return filePack;

        List<ComplianceRule> curatedMapped = [];

        foreach (CuratedRulesRuleEntry entry in doc.Rules)
        {
            ComplianceRule? mapped = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

            if (mapped is not null)
                curatedMapped.Add(mapped);
        }

        if (curatedMapped.Count == 0)
            return filePack;

        Dictionary<string, ComplianceRule> byId = curatedMapped
            .ToDictionary(r => r.RuleId, r => r, StringComparer.OrdinalIgnoreCase);
        HashSet<string> fileRuleIds = filePack.Rules
            .Select(r => r.RuleId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        List<ComplianceRule> merged = [];
        foreach (ComplianceRule fileRule in filePack.Rules)
        {
            if (byId.TryGetValue(fileRule.RuleId, out ComplianceRule? replacement))
                merged.Add(replacement);
            else
                merged.Add(fileRule);
        }

        foreach (ComplianceRule curated in curatedMapped)
        {
            if (fileRuleIds.Contains(curated.RuleId))
                continue;
            merged.Add(curated);
        }

        return new ComplianceRulePack
        {
            RulePackId = filePack.RulePackId,
            Name = filePack.Name,
            Version = filePack.Version,
            RulePackHash = filePack.RulePackHash,
            SourcePath = filePack.SourcePath,
            Rules = merged,
        };
    }
}
