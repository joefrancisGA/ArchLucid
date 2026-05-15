using System.Security.Claims;

using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HttpScopeContextProviderTests
{
    [Fact]
    public void GetCurrentScope_returns_ambient_override_when_set()
    {
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        ScopeContext pushed = new() { TenantId = tenant, WorkspaceId = workspace, ProjectId = project };

        HttpContextAccessor accessor = new();
        HttpScopeContextProvider sut = new(accessor);

        using (AmbientScopeContext.Push(pushed))
        {
            ScopeContext resolved = sut.GetCurrentScope();

            resolved.TenantId.Should().Be(tenant);
            resolved.WorkspaceId.Should().Be(workspace);
            resolved.ProjectId.Should().Be(project);
        }
    }

    [Fact]
    public void GetCurrentScope_prefers_jwt_claim_over_header()
    {
        Guid fromClaim = Guid.NewGuid();
        Guid fromHeader = Guid.NewGuid();

        ClaimsIdentity identity = new("tst");
        identity.AddClaim(new Claim("tenant_id", fromClaim.ToString()));
        ClaimsPrincipal user = new(identity);

        DefaultHttpContext http = new() { User = user };
        http.Request.Headers["x-tenant-id"] = fromHeader.ToString();

        HttpContextAccessor accessor = new() { HttpContext = http };
        HttpScopeContextProvider sut = new(accessor);

        ScopeContext scope = sut.GetCurrentScope();

        scope.TenantId.Should().Be(fromClaim);
    }

    [Fact]
    public void GetCurrentScope_reads_scope_header_when_claim_absent()
    {
        Guid fromHeader = Guid.NewGuid();

        DefaultHttpContext http = new();
        http.Request.Headers["x-tenant-id"] = fromHeader.ToString();
        http.Request.Headers["x-workspace-id"] = ScopeIds.DefaultWorkspace.ToString();
        http.Request.Headers["x-project-id"] = ScopeIds.DefaultProject.ToString();

        HttpContextAccessor accessor = new() { HttpContext = http };
        HttpScopeContextProvider sut = new(accessor);

        ScopeContext scope = sut.GetCurrentScope();

        scope.TenantId.Should().Be(fromHeader);
        scope.WorkspaceId.Should().Be(ScopeIds.DefaultWorkspace);
        scope.ProjectId.Should().Be(ScopeIds.DefaultProject);
    }

    [Fact]
    public void GetCurrentScope_falls_back_to_defaults_when_unparseable()
    {
        DefaultHttpContext http = new();
        http.Request.Headers["x-tenant-id"] = "not-a-guid";

        HttpContextAccessor accessor = new() { HttpContext = http };
        HttpScopeContextProvider sut = new(accessor);

        ScopeContext scope = sut.GetCurrentScope();

        scope.TenantId.Should().Be(ScopeIds.DefaultTenant);
    }
}
