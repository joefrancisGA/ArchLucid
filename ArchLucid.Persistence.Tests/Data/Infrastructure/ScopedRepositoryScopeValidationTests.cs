using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class ScopedRepositoryScopeValidationTests
{
    [SkippableFact]
    public void RequireScopedTenant_empty_tenant_throws()
    {
        ScopeContext scope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        Action act = () => ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*ScopeContext.TenantId*");
    }

    [SkippableFact]
    public void RequireScopedTenant_non_empty_tenant_does_not_throw()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        Action act = () => ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        act.Should().NotThrow();
    }

    [SkippableFact]
    public void RequireEntityTenant_empty_throws()
    {
        Action act = () => ScopedRepositoryScopeValidation.RequireEntityTenant(Guid.Empty);

        act.Should().Throw<InvalidOperationException>().WithMessage("*TenantId*");
    }
}
