using System.Text.Json;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Collects assigned rule identifiers from a <see cref="PolicyPackContentDocument" />.</summary>
public static class PolicyPackAssignedRuleIdCollector
{
    private const string CuratedRulesMetadataKey = "pack.curatedRules.v1";

    public static HashSet<string> Collect(PolicyPackContentDocument pack)
    {
        ArgumentNullException.ThrowIfNull(pack);

        HashSet<string> ruleIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string key in pack.ComplianceRuleKeys)
        {
            if (string.IsNullOrWhiteSpace(key))
                continue;

            ruleIds.Add(key.Trim());
        }

        foreach (Guid ruleId in pack.ComplianceRuleIds)
            ruleIds.Add(ruleId.ToString("D"));

        if (pack.Metadata.TryGetValue(CuratedRulesMetadataKey, out string? curatedJson)
            && !string.IsNullOrWhiteSpace(curatedJson))
            AddCuratedRuleIdsFromMetadata(curatedJson, ruleIds);

        return ruleIds;
    }

    private static void AddCuratedRuleIdsFromMetadata(string curatedJson, HashSet<string> ruleIds)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(curatedJson);

            if (!document.RootElement.TryGetProperty("rules", out JsonElement rules)
                || rules.ValueKind != JsonValueKind.Array)
                return;

            foreach (JsonElement rule in rules.EnumerateArray())
            {
                if (!rule.TryGetProperty("id", out JsonElement idElement)
                    || idElement.ValueKind != JsonValueKind.String)
                    continue;

                string? id = idElement.GetString();

                if (string.IsNullOrWhiteSpace(id))
                    continue;

                ruleIds.Add(id.Trim());
            }
        }
        catch (JsonException)
        {
            // Malformed curated-rules metadata is ignored (offline corpus mirrors live pack tolerance).
        }
    }
}