using ArchLucid.Contracts.Scoping;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReadScopeTripleTests
{
    [Fact]
    public void EnsureValid_returns_the_scope_when_all_components_are_present()
    {
        ReadScopeTriple scope = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        scope.IsValid.Should().BeTrue();
        scope.EnsureValid().Should().Be(scope);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void EnsureValid_rejects_an_empty_component(int emptyComponent)
    {
        Guid tenantId = emptyComponent == 0 ? Guid.Empty : Guid.NewGuid();
        Guid workspaceId = emptyComponent == 1 ? Guid.Empty : Guid.NewGuid();
        Guid projectId = emptyComponent == 2 ? Guid.Empty : Guid.NewGuid();
        ReadScopeTriple scope = new(tenantId, workspaceId, projectId);

        scope.IsValid.Should().BeFalse();
        Action act = () => scope.EnsureValid();
        act.Should().Throw<ArgumentException>();
    }
}
