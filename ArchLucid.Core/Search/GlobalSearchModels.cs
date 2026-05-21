namespace ArchLucid.Core.Search;

public sealed class GlobalSearchRunHit
{
    public Guid RunId
    {
        get;
        init;
    }

    public string? Description
    {
        get;
        init;
    }

    public string? AuthorityProjectSlug
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}

public sealed class GlobalSearchFindingHit
{
    public Guid RunId
    {
        get;
        init;
    }

    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Severity
    {
        get;
        init;
    } = string.Empty;
}

public sealed class GlobalSearchPolicyPackHit
{
    public Guid PolicyPackId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public bool IsCatalogEntry
    {
        get;
        init;
    }
}

public sealed class GlobalSearchResult
{
    public IReadOnlyList<GlobalSearchRunHit> Runs
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GlobalSearchFindingHit> Findings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GlobalSearchPolicyPackHit> PolicyPacks
    {
        get;
        init;
    } = [];
}

public interface IGlobalSearchRepository
{
    Task<GlobalSearchResult> SearchAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string query,
        int takePerCategory,
        CancellationToken cancellationToken);
}
