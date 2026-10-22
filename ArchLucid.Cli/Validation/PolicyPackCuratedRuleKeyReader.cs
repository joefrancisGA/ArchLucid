using System.Text.Json;

namespace ArchLucid.Cli.Validation;

/// <summary>
///     Reads curated rule ids from <c>pack.curatedRules.v1</c> metadata for CLI validation warnings.
/// </summary>
internal static class PolicyPackCuratedRuleKeyReader
{
    private const string CuratedRulesMetadataKey = "pack.curatedRules.v1";

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    internal static IReadOnlyCollection<string> ReadRuleIdsFromMetadata(IReadOnlyDictionary<string, string> metadata)
    {
        if (!metadata.TryGetValue(CuratedRulesMetadataKey, out string? raw) ||
            string.IsNullOrWhiteSpace(raw))
        {
            return [];
        }

        CuratedRulesMetadataDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<CuratedRulesMetadataDocument>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            return [];
        }

        if (document?.Rules is null || document.Rules.Count == 0)
            return [];

        List<string> ids = new(document.Rules.Count);

        foreach (CuratedRulesMetadataRuleEntry rule in document.Rules)
        {
            if (!string.IsNullOrWhiteSpace(rule.Id))
                ids.Add(rule.Id.Trim());
        }

        return ids;
    }

    private sealed class CuratedRulesMetadataDocument
    {
        public List<CuratedRulesMetadataRuleEntry>? Rules
        {
            get;
            set;
        }
    }

    private sealed class CuratedRulesMetadataRuleEntry
    {
        public string? Id
        {
            get;
            set;
        }
    }
}
