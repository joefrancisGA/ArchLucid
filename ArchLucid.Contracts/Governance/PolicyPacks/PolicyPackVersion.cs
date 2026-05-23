namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Immutable snapshot of pack content for a specific SemVer-style label.</summary>
public class PolicyPackVersion
{
    public Guid PolicyPackVersionId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string Version
    {
        get;
        set;
    } = null!;

    public string ContentJson
    {
        get;
        set;
    } = null!;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public bool IsPublished
    {
        get;
        set;
    }
}
