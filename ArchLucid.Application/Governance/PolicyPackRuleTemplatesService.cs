using System.Text.Json;

using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IPolicyPackRuleTemplatesService" />
public sealed class PolicyPackRuleTemplatesService : IPolicyPackRuleTemplatesService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <inheritdoc />
    public IReadOnlyList<PolicyPackRuleTemplateItem> ListTemplates()
    {
        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();
        List<PolicyPackRuleTemplateItem> templates = new(bundles.Count);

        foreach (DefaultPolicyPackBundleDefinition bundle in bundles)
        {
            PolicyPackContentDocument? document =
                JsonSerializer.Deserialize<PolicyPackContentDocument>(bundle.ContentJson, JsonOptions);

            if (document is null)
                continue;

            string templateId = ResolveMetadata(document, "templateId", bundle.DisplayName);
            string category = ResolveMetadata(document, "pack.category", "General");

            templates.Add(new PolicyPackRuleTemplateItem
            {
                TemplateId = templateId,
                DisplayName = bundle.DisplayName,
                Description = bundle.Description,
                Category = category,
                ContentJson = bundle.ContentJson,
            });
        }

        return templates;
    }

    private static string ResolveMetadata(PolicyPackContentDocument document, string key, string fallback)
    {
        if (document.Metadata.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
            return value.Trim();

        return fallback;
    }
}
