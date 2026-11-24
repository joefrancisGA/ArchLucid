using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceScopeCollectionImmutabilityTests
{
    [Fact]
    public void Canonical_scope_levels_cannot_be_replaced()
    {
        Assert.Equal(new[] { GovernanceScopeLevel.Tenant, GovernanceScopeLevel.Workspace, GovernanceScopeLevel.Project },
            GovernanceScopeLevel.All.ToArray());
        IList<string> levels = Assert.IsAssignableFrom<IList<string>>(GovernanceScopeLevel.All);
        Assert.Throws<NotSupportedException>(() => { levels[0] = "Unknown"; });
        Assert.Equal(GovernanceScopeLevel.Tenant, GovernanceScopeLevel.TryNormalize("TENANT"));
        Assert.Null(GovernanceScopeLevel.TryNormalize("Unknown"));
    }

    [Fact]
    public void Reserved_distribution_scopes_cannot_be_removed()
    {
        IReadOnlySet<string> scopes = PolicyPackDistributionScopeRules.ReservedUnimplementedScopes;
        Assert.True(scopes.Contains("marketplace"));
        Assert.True(scopes.Contains("organizationshared"));
        if (scopes is ICollection<string> collection)
        {
            Assert.True(collection.IsReadOnly);
            Assert.Throws<NotSupportedException>(() => { collection.Remove(PolicyPackDistributionScope.Marketplace); });
        }
        Assert.Throws<ArgumentException>(() => PolicyPackDistributionScopeRules.RejectReservedScope("marketplace"));
        Assert.Throws<ArgumentException>(() => PolicyPackDistributionScopeRules.RejectReservedScope("organizationshared"));
    }
}
