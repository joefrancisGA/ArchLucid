namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ReviewCacheDependencyManifest
{
    public string ContentHash
    {
        get;
        set;
    } = null!;

    public string PromptVersion
    {
        get;
        set;
    } = null!;

    public string ModelVersion
    {
        get;
        set;
    } = null!;

    public string PolicyPackVersion
    {
        get;
        set;
    } = null!;

    public string RubricVersion
    {
        get;
        set;
    } = null!;

    public string TenantConfigurationHash
    {
        get;
        set;
    } = null!;

    public string DeclaredPrioritiesHash
    {
        get;
        set;
    } = null!;

    public int SchemaVersion
    {
        get;
        set;
    }

    public string? ReuseReason
    {
        get;
        set;
    }
}
