using ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowReferenceRbacScopeResolverTests
{
    [Fact]
    public void Resolver_distinguishes_subscription_resource_group_resource_and_unrelated_scopes()
    {
        const string subscription = "/subscriptions/11111111-1111-1111-1111-111111111111";
        const string resourceGroup = subscription + "/resourceGroups/payments";
        const string resource = resourceGroup + "/providers/Microsoft.KeyVault/vaults/prod-kv";
        const string siblingResourceGroup = subscription + "/resourceGroups/other";
        const string unrelatedSubscription = "/subscriptions/22222222-2222-2222-2222-222222222222";

        IReadOnlySet<string> effective = ReferenceRbacScopeResolver.ResolveEffectiveScopes(
            [subscription, resourceGroup, resource, siblingResourceGroup, unrelatedSubscription],
            resource);

        effective.Should().BeEquivalentTo([subscription, resourceGroup, resource]);
    }

    [Fact]
    public void Resolver_is_case_and_trailing_slash_insensitive()
    {
        const string assignment = "/SUBSCRIPTIONS/SUB/RESOURCEGROUPS/RG/";
        const string resource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

        ReferenceRbacScopeResolver.AppliesTo(assignment, resource).Should().BeTrue();
    }
}
