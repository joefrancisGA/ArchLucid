using ArchLucid.Core.Search;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Search;

public interface IGlobalSearchService
{
    Task<GlobalSearchResult> SearchAsync(string query, int takePerCategory, CancellationToken cancellationToken);
}

public sealed class GlobalSearchService(
    IGlobalSearchRepository repository,
    IScopeContextProvider scopeProvider) : IGlobalSearchService
{
    private readonly IGlobalSearchRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    public Task<GlobalSearchResult> SearchAsync(
        string query,
        int takePerCategory,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return _repository.SearchAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            query,
            takePerCategory,
            cancellationToken);
    }
}
