using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingRelationalScopeTests
{
    [Fact]
    public void FromScopeContext_copies_the_tenant_triple()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        FindingRelationalScope relationalScope = FindingRelationalScope.FromScopeContext(scope);

        relationalScope.TenantId.Should().Be(scope.TenantId);
        relationalScope.WorkspaceId.Should().Be(scope.WorkspaceId);
        relationalScope.ProjectId.Should().Be(scope.ProjectId);
    }

    [Fact]
    public void FromScopeContext_rejects_null_scope()
    {
        Action act = () => FindingRelationalScope.FromScopeContext(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
