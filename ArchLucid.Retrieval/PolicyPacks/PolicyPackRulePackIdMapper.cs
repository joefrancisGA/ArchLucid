using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Retrieval.PolicyPacks;

/// <summary>Maps assigned policy packs to indexed corpus <c>rulePackId</c> keys.</summary>
public static class PolicyPackRulePackIdMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static string? TryResolveRulePackId(ResolvedPolicyPack pack, string? templatesRoot = null)
    {
        ArgumentNullException.ThrowIfNull(pack);

        if (string.IsNullOrWhiteSpace(pack.ContentJson))
            return null;

        PolicyPackContentDocument? content =
            JsonSerializer.Deserialize<PolicyPackContentDocument>(pack.ContentJson, JsonOptions);

        if (content?.Metadata is not null
            && content.Metadata.TryGetValue("rulePackId", out string? explicitId)
            && !string.IsNullOrWhiteSpace(explicitId))
            return explicitId.Trim();

        if (content?.Metadata is not null
            && content.Metadata.TryGetValue("vertical", out string? vertical)
            && !string.IsNullOrWhiteSpace(vertical))
        {
            string? fromTemplate = TryReadRulePackIdFromVerticalTemplate(vertical.Trim(), templatesRoot);

            if (!string.IsNullOrWhiteSpace(fromTemplate))
                return fromTemplate;
        }

        return null;
    }

    private static string? TryReadRulePackIdFromVerticalTemplate(string verticalSlug, string? templatesRoot)
    {
        string root = ResolveTemplatesRoot(templatesRoot);
        string rulesPath = Path.Combine(root, verticalSlug, "compliance-rules.json");

        if (!File.Exists(rulesPath))
            return null;

        try
        {
            using FileStream stream = File.OpenRead(rulesPath);
            ComplianceRulesProbe? probe = JsonSerializer.Deserialize<ComplianceRulesProbe>(stream, JsonOptions);

            return string.IsNullOrWhiteSpace(probe?.RulePackId) ? null : probe.RulePackId.Trim();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string ResolveTemplatesRoot(string? configured)
    {
        if (!string.IsNullOrWhiteSpace(configured) && Directory.Exists(configured))
            return configured;

        string relativeToBase = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "templates", "policy-packs"));

        if (Directory.Exists(relativeToBase))
            return relativeToBase;

        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, "templates", "policy-packs");

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return relativeToBase;
    }

    private sealed class ComplianceRulesProbe
    {
        public string? RulePackId { get; set; }
    }
}
