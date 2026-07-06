using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Scoping;

namespace ArchLucid.Persistence.Tests.Scoping;

[Trait("Category", "Unit")]
public sealed class EmptyPersistenceScopeContextProviderTests
{
    [Fact]
    public void GetCurrentScope_returns_empty_triple()
    {
        EmptyPersistenceScopeContextProvider sut = new();

        sut.GetCurrentScope().TenantId.Should().Be(Guid.Empty);
        sut.GetCurrentScope().WorkspaceId.Should().Be(Guid.Empty);
        sut.GetCurrentScope().ProjectId.Should().Be(Guid.Empty);
    }

    [Fact]
    public void ResolveCurrentScope_marks_default_source()
    {
        EmptyPersistenceScopeContextProvider sut = new();

        ScopeResolution resolution = sut.ResolveCurrentScope();

        resolution.Scope.TenantId.Should().Be(Guid.Empty);
        resolution.Tenant.Source.Should().Be(ScopeSource.Default);
    }
}
