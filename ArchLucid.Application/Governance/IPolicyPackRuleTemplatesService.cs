namespace ArchLucid.Application.Governance;

/// <summary>Read-side catalog of bundled starter policy pack templates for operator authoring UIs.</summary>
public interface IPolicyPackRuleTemplatesService
{
    /// <summary>Returns bundled starter templates from <c>bundled-policy-packs-v1.manifest.json</c>.</summary>
    IReadOnlyList<PolicyPackRuleTemplateItem> ListTemplates();
}
