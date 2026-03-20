using ArchiForge.Core.Scoping;

namespace ArchiForge.Api.Auth.Services;

public sealed class HttpScopeContextProvider : IScopeContextProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpScopeContextProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public ScopeContext GetCurrentScope()
    {
        var http = _httpContextAccessor.HttpContext;
        var user = http?.User;
        var headers = http?.Request.Headers;

        Guid TryGetClaim(string claim, Guid fallback)
        {
            var value = user?.FindFirst(claim)?.Value;
            return Guid.TryParse(value, out var parsed) ? parsed : fallback;
        }

        Guid TryHeader(string key, Guid fallback)
        {
            if (headers is not null && headers.TryGetValue(key, out var value))
            {
                if (Guid.TryParse(value.ToString(), out var parsed))
                    return parsed;
            }

            return fallback;
        }

        var tenant = TryHeader("x-tenant-id", TryGetClaim("tenant_id", ScopeIds.DefaultTenant));
        var workspace = TryHeader("x-workspace-id", TryGetClaim("workspace_id", ScopeIds.DefaultWorkspace));
        var project = TryHeader("x-project-id", TryGetClaim("project_id", ScopeIds.DefaultProject));

        return new ScopeContext
        {
            TenantId = tenant,
            WorkspaceId = workspace,
            ProjectId = project
        };
    }
}
