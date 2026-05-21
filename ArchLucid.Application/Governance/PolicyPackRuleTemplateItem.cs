namespace ArchLucid.Application.Governance;

/// <summary>Starter policy pack template flattened from the bundled V1 manifest for the visual rule builder.</summary>
public sealed class PolicyPackRuleTemplateItem
{
    public required string TemplateId
    {
        get;
        init;
    }

    public required string DisplayName
    {
        get;
        init;
    }

    public required string Description
    {
        get;
        init;
    }

    public required string Category
    {
        get;
        init;
    }

    /// <summary>Serialized <see cref="Decisioning.Governance.PolicyPacks.PolicyPackContentDocument" /> JSON (source of truth).</summary>
    public required string ContentJson
    {
        get;
        init;
    }
}
