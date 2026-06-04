using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class TrialLocalJwtScopeDefaultsTests
{
    [Fact]
    public void Resolve_returns_platform_default_scope_triple()
    {
        (Guid tenantId, Guid workspaceId, Guid projectId) = TrialLocalJwtScopeDefaults.Resolve();

        tenantId.Should().Be(ScopeIds.DefaultTenant);
        workspaceId.Should().Be(ScopeIds.DefaultWorkspace);
        projectId.Should().Be(ScopeIds.DefaultProject);
    }
}
